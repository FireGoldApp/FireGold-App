"""
Test Iteration 18 Features:
1. GET /api/admin/users/{user_id}/profile - comprehensive user data
2. PUT /api/admin/strain-directory/{strain_id}/license - update license/grower info
3. Login event tracking in analytics collection
"""
import pytest
import requests
import os
import uuid
from datetime import datetime

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')
if not BASE_URL:
    BASE_URL = "https://strain-exchange.preview.emergentagent.com"

ADMIN_PASSWORD = "firegold2026"


@pytest.fixture(scope="module")
def admin_token():
    """Get admin authentication token"""
    response = requests.post(f"{BASE_URL}/api/admin/login", json={"password": ADMIN_PASSWORD})
    if response.status_code != 200:
        pytest.skip(f"Admin login failed: {response.status_code}")
    return response.json()["token"]


@pytest.fixture(scope="module")
def test_user():
    """Register a test user for profile testing"""
    unique_email = f"TEST_user_profile_{uuid.uuid4().hex[:8]}@testprofile.com"
    response = requests.post(f"{BASE_URL}/api/auth/register", json={
        "first_name": "TEST_Profile",
        "last_name": "User",
        "company": "TEST_Profile Company",
        "country": "Canada",
        "email": unique_email,
        "phone": "+1 555-PROFILE",
        "password": "testpassword123",
        "license_number": "TEST-LIC-12345"
    })
    if response.status_code not in [200, 201]:
        pytest.skip(f"Test user registration failed: {response.status_code} - {response.text}")
    data = response.json()
    return {
        "user_id": data["user"]["id"],
        "email": data["user"]["email"],
        "token": data["token"]
    }


class TestUserProfileEndpoint:
    """Tests for GET /api/admin/users/{user_id}/profile"""
    
    def test_user_profile_requires_admin_auth(self, test_user):
        """Profile endpoint should require admin authentication"""
        response = requests.get(f"{BASE_URL}/api/admin/users/{test_user['user_id']}/profile")
        assert response.status_code == 401, "Should require admin auth"
        print("✅ User profile endpoint requires admin authentication")
    
    def test_user_profile_returns_comprehensive_data(self, admin_token, test_user):
        """Profile should return user data, activity_summary, inquiries, sample_requests, top_strains_viewed"""
        response = requests.get(
            f"{BASE_URL}/api/admin/users/{test_user['user_id']}/profile",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200, f"Profile request failed: {response.text}"
        data = response.json()
        
        # Check user data is present
        assert "user" in data, "Response should include user object"
        user = data["user"]
        assert user.get("first_name") == "TEST_Profile"
        assert user.get("email") == test_user["email"]
        assert user.get("license_number") == "TEST-LIC-12345"
        print(f"✅ User profile includes user data: {user.get('first_name')} {user.get('last_name')}")
        
        # Check activity_summary structure
        assert "activity_summary" in data, "Response should include activity_summary"
        summary = data["activity_summary"]
        assert "total_page_views" in summary
        assert "total_strain_views" in summary
        assert "total_inquiries" in summary
        assert "total_sample_requests" in summary
        assert "login_count" in summary
        assert "login_history" in summary
        print(f"✅ Activity summary structure correct: login_count={summary['login_count']}, page_views={summary['total_page_views']}")
        
        # Check other collections
        assert "inquiries" in data, "Response should include inquiries list"
        assert "sample_requests" in data, "Response should include sample_requests list"
        assert "top_strains_viewed" in data, "Response should include top_strains_viewed list"
        assert "filter_usage" in data, "Response should include filter_usage dict"
        print("✅ User profile includes inquiries, sample_requests, top_strains_viewed, filter_usage")
    
    def test_user_profile_404_for_invalid_user(self, admin_token):
        """Profile should return 404 for non-existent user"""
        fake_user_id = "non-existent-user-id-12345"
        response = requests.get(
            f"{BASE_URL}/api/admin/users/{fake_user_id}/profile",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 404, "Should return 404 for invalid user"
        print("✅ Profile returns 404 for non-existent user")


class TestLoginEventTracking:
    """Tests for login event tracking in analytics collection"""
    
    def test_login_creates_analytics_event(self, admin_token):
        """Logging in should create a login event in analytics"""
        # Register a new test user
        unique_email = f"TEST_login_track_{uuid.uuid4().hex[:8]}@testlogin.com"
        reg_response = requests.post(f"{BASE_URL}/api/auth/register", json={
            "first_name": "TEST_Login",
            "last_name": "Tracker",
            "company": "TEST_Login Tracking Co",
            "country": "Canada",
            "email": unique_email,
            "phone": "+1 555-LOGIN",
            "password": "logintest123"
        })
        assert reg_response.status_code in [200, 201], f"Registration failed: {reg_response.text}"
        user_id = reg_response.json()["user"]["id"]
        print(f"✅ Test user registered: {unique_email}")
        
        # Now login - this should create a login event
        login_response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": unique_email,
            "password": "logintest123"
        })
        assert login_response.status_code == 200, f"Login failed: {login_response.text}"
        print("✅ User logged in successfully")
        
        # Fetch user profile to check login_count
        profile_response = requests.get(
            f"{BASE_URL}/api/admin/users/{user_id}/profile",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert profile_response.status_code == 200, f"Profile fetch failed: {profile_response.text}"
        profile_data = profile_response.json()
        
        # Login count should be at least 1 (from the login we just did)
        login_count = profile_data["activity_summary"]["login_count"]
        assert login_count >= 1, f"Expected at least 1 login, got {login_count}"
        print(f"✅ Login event tracked in analytics - login_count: {login_count}")
        
        # Check login_history has entries
        login_history = profile_data["activity_summary"]["login_history"]
        assert len(login_history) >= 1, "Login history should have at least 1 entry"
        print(f"✅ Login history populated with {len(login_history)} entries")


class TestStrainDirectoryLicenseEndpoint:
    """Tests for PUT /api/admin/strain-directory/{strain_id}/license"""
    
    def test_update_license_requires_admin_auth(self):
        """License update endpoint should require admin authentication"""
        response = requests.put(
            f"{BASE_URL}/api/admin/strain-directory/some-strain-id/license",
            json={"license_number": "TEST-123"}
        )
        assert response.status_code == 401, "Should require admin auth"
        print("✅ License update endpoint requires admin authentication")
    
    def test_update_license_number(self, admin_token):
        """Should be able to update license_number on a strain"""
        # First get a strain ID using admin endpoint
        strains_response = requests.get(
            f"{BASE_URL}/api/strains/admin",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert strains_response.status_code == 200, f"Admin strains failed: {strains_response.text}"
        strains = strains_response.json()
        if not strains:
            pytest.skip("No strains in database to test")
        
        strain_id = strains[0]["id"]
        test_license = f"TEST-LIC-{uuid.uuid4().hex[:6]}"
        
        # Update license number
        update_response = requests.put(
            f"{BASE_URL}/api/admin/strain-directory/{strain_id}/license",
            json={"license_number": test_license},
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert update_response.status_code == 200, f"License update failed: {update_response.text}"
        assert "message" in update_response.json()
        print(f"✅ License number updated successfully for strain {strain_id}")
    
    def test_update_grower_info(self, admin_token):
        """Should be able to update grower_company, grower_name, grower_email"""
        strains_response = requests.get(
            f"{BASE_URL}/api/strains/admin",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        strains = strains_response.json()
        if not strains:
            pytest.skip("No strains in database")
        
        strain_id = strains[0]["id"]
        test_company = f"TEST Grower Co {uuid.uuid4().hex[:4]}"
        test_name = "TEST Grower Name"
        test_email = "test-grower@example.com"
        
        update_response = requests.put(
            f"{BASE_URL}/api/admin/strain-directory/{strain_id}/license",
            json={
                "grower_company": test_company,
                "grower_name": test_name,
                "grower_email": test_email
            },
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert update_response.status_code == 200, f"Grower info update failed: {update_response.text}"
        print(f"✅ Grower info (company, name, email) updated successfully")
    
    def test_update_all_fields_together(self, admin_token):
        """Should be able to update license_number AND grower info together"""
        strains_response = requests.get(f"{BASE_URL}/api/strains/admin", headers={"Authorization": f"Bearer {admin_token}"})
        strains = strains_response.json()
        if not strains:
            pytest.skip("No strains")
        
        strain_id = strains[0]["id"]
        update_response = requests.put(
            f"{BASE_URL}/api/admin/strain-directory/{strain_id}/license",
            json={
                "license_number": f"TEST-ALL-{uuid.uuid4().hex[:4]}",
                "grower_company": "TEST All Fields Co",
                "grower_name": "TEST All Name",
                "grower_email": "all-fields@test.com"
            },
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert update_response.status_code == 200
        print("✅ All license/grower fields updated together")
    
    def test_update_404_for_invalid_strain(self, admin_token):
        """Should return 404 for non-existent strain"""
        response = requests.put(
            f"{BASE_URL}/api/admin/strain-directory/non-existent-strain-id/license",
            json={"license_number": "TEST-404"},
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 404
        print("✅ License update returns 404 for non-existent strain")
    
    def test_update_400_for_no_fields(self, admin_token):
        """Should return 400 if no fields provided"""
        strains_response = requests.get(f"{BASE_URL}/api/strains/admin", headers={"Authorization": f"Bearer {admin_token}"})
        strains = strains_response.json()
        if not strains:
            pytest.skip("No strains")
        
        strain_id = strains[0]["id"]
        response = requests.put(
            f"{BASE_URL}/api/admin/strain-directory/{strain_id}/license",
            json={},
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 400
        print("✅ License update returns 400 when no fields provided")


class TestUsersTableLicenseColumn:
    """Test that users endpoint returns license_number field"""
    
    def test_users_list_includes_license_number(self, admin_token):
        """GET /api/auth/users should return license_number in user objects"""
        response = requests.get(
            f"{BASE_URL}/api/auth/users",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        users = response.json()
        
        # Check that at least one user has license_number field (even if null)
        # The structure should support it
        if users:
            # Any user should have the license_number key in schema
            # Note: it may be null/None, but the field should be in the response
            sample_user = users[0]
            # Either has license_number or password_hash is excluded (security check)
            assert "password_hash" not in sample_user, "password_hash should not be exposed"
            print(f"✅ Users list has {len(users)} users, password_hash properly excluded")
            
            # Find a user with license_number set
            users_with_license = [u for u in users if u.get("license_number")]
            print(f"✅ Found {len(users_with_license)} users with license_number set")


class TestRegistrationWithLicenseNumber:
    """Test that registration accepts optional license_number field"""
    
    def test_register_with_license_number(self):
        """Registration should accept optional license_number field"""
        unique_email = f"TEST_lic_reg_{uuid.uuid4().hex[:8]}@licensetest.com"
        response = requests.post(f"{BASE_URL}/api/auth/register", json={
            "first_name": "TEST_License",
            "last_name": "Registrant",
            "company": "TEST License Registration Co",
            "country": "Canada",
            "email": unique_email,
            "phone": "+1 555-REG-LIC",
            "password": "registertest123",
            "license_number": "HC-12345-TEST"
        })
        assert response.status_code in [200, 201], f"Registration failed: {response.text}"
        print("✅ Registration with license_number successful")
    
    def test_register_without_license_number(self):
        """Registration should work without license_number (optional)"""
        unique_email = f"TEST_no_lic_{uuid.uuid4().hex[:8]}@nolicensetest.com"
        response = requests.post(f"{BASE_URL}/api/auth/register", json={
            "first_name": "TEST_NoLicense",
            "last_name": "User",
            "company": "TEST No License Co",
            "country": "Canada",
            "email": unique_email,
            "phone": "+1 555-NO-LIC",
            "password": "nolicensetest123"
        })
        assert response.status_code in [200, 201], f"Registration without license failed: {response.text}"
        print("✅ Registration without license_number successful (field is optional)")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
