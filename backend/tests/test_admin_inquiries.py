"""
Test Admin Inquiry Management Hub - Backend Tests
Testing: GET /api/admin/inquiries and PUT /api/admin/inquiries/{id}/status
"""
import pytest
import requests
import os
import time

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')
ADMIN_PASSWORD = "firegold2026"

@pytest.fixture(scope="module")
def admin_token():
    """Get admin token for testing"""
    response = requests.post(f"{BASE_URL}/api/admin/login", json={"password": ADMIN_PASSWORD})
    assert response.status_code == 200, f"Admin login failed: {response.text}"
    return response.json().get("token")

@pytest.fixture(scope="module")
def user_token():
    """Register a test user and get token"""
    test_email = f"test_inquiry_{int(time.time())}@testfiregold.com"
    response = requests.post(f"{BASE_URL}/api/auth/register", json={
        "first_name": "TestInquiry",
        "last_name": "User",
        "company": "Test Inquiry Corp",
        "country": "Canada",
        "email": test_email,
        "phone": "+1-555-9876",
        "password": "testpass123"
    })
    if response.status_code == 200:
        return response.json().get("token"), response.json().get("user", {}).get("id")
    # If registration fails due to duplicate, try login
    response = requests.post(f"{BASE_URL}/api/auth/login", json={
        "email": test_email,
        "password": "testpass123"
    })
    if response.status_code == 200:
        return response.json().get("token"), response.json().get("user", {}).get("id")
    pytest.skip("Could not authenticate test user")

@pytest.fixture(scope="module")
def sample_strain_ids(user_token):
    """Get sample strain IDs for creating test inquiry"""
    token, user_id = user_token
    response = requests.get(
        f"{BASE_URL}/api/strains",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert response.status_code == 200, f"Failed to get strains: {response.status_code} {response.text}"
    strains = response.json()
    if len(strains) < 2:
        pytest.skip("Need at least 2 strains for inquiry tests")
    return [strains[0]["id"], strains[1]["id"]]


class TestAdminInquiriesEndpoint:
    """Tests for GET /api/admin/inquiries endpoint"""
    
    def test_get_admin_inquiries_requires_auth(self):
        """GET /api/admin/inquiries without token should return 401"""
        response = requests.get(f"{BASE_URL}/api/admin/inquiries")
        assert response.status_code == 401
        print("✅ Admin inquiries endpoint requires authentication")
    
    def test_get_admin_inquiries_returns_list(self, admin_token):
        """GET /api/admin/inquiries returns list of enriched inquiries"""
        response = requests.get(
            f"{BASE_URL}/api/admin/inquiries",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list), "Expected list of inquiries"
        print(f"✅ Admin inquiries endpoint returns {len(data)} inquiries")
        
        # Validate enriched fields if inquiries exist
        if len(data) > 0:
            inq = data[0]
            assert "id" in inq
            assert "company_name" in inq
            assert "contact_name" in inq
            assert "email" in inq
            assert "status" in inq
            assert "strain_names" in inq, "Inquiry should have strain_names (enriched)"
            assert isinstance(inq["strain_names"], list), "strain_names should be a list"
            print(f"✅ Inquiry has enriched fields including strain_names: {inq['strain_names']}")
    
    def test_get_admin_inquiries_filter_by_status(self, admin_token):
        """GET /api/admin/inquiries?status=pending filters correctly"""
        response = requests.get(
            f"{BASE_URL}/api/admin/inquiries?status=pending",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        # All returned inquiries should have status=pending
        for inq in data:
            assert inq["status"] == "pending", f"Expected pending, got {inq['status']}"
        print(f"✅ Status filter works, {len(data)} pending inquiries")


class TestCreateInquiryWithStrainNames:
    """Test that POST /api/inquiries creates inquiry with strain_names"""
    
    def test_create_inquiry_stores_strain_names(self, user_token, sample_strain_ids, admin_token):
        """POST /api/inquiries creates inquiry with strain_names for quick retrieval"""
        token, user_id = user_token
        
        response = requests.post(
            f"{BASE_URL}/api/inquiries",
            headers={"Authorization": f"Bearer {token}"},
            json={
                "company_name": "TEST_InquiryHub Corp",
                "contact_name": "TEST John Doe",
                "email": "test@testcorp.com",
                "phone": "+1-555-1234",
                "strain_ids": sample_strain_ids,
                "message": "TEST: Testing inquiry hub functionality"
            }
        )
        
        assert response.status_code == 200, f"Inquiry creation failed: {response.text}"
        data = response.json()
        assert "id" in data, f"Response should have 'id': {data}"
        inquiry_id = data["id"]
        print(f"✅ Created test inquiry with ID: {inquiry_id}")
        
        # Now fetch via admin endpoint and verify strain_names
        admin_response = requests.get(
            f"{BASE_URL}/api/admin/inquiries",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert admin_response.status_code == 200
        inquiries = admin_response.json()
        
        # Find our test inquiry
        test_inq = next((i for i in inquiries if i["id"] == inquiry_id), None)
        assert test_inq is not None, "Could not find created inquiry"
        
        # Verify strain_names populated
        assert "strain_names" in test_inq
        assert len(test_inq["strain_names"]) == len(sample_strain_ids)
        print(f"✅ Inquiry has strain_names: {test_inq['strain_names']}")
        
        return inquiry_id


class TestUpdateInquiryStatus:
    """Tests for PUT /api/admin/inquiries/{id}/status endpoint"""
    
    @pytest.fixture
    def test_inquiry_id(self, user_token, sample_strain_ids, admin_token):
        """Create a test inquiry to update"""
        token, user_id = user_token
        
        response = requests.post(
            f"{BASE_URL}/api/inquiries",
            headers={"Authorization": f"Bearer {token}"},
            json={
                "company_name": "TEST_StatusUpdate Corp",
                "contact_name": "TEST Status Tester",
                "email": "status@testcorp.com",
                "strain_ids": [sample_strain_ids[0]],
                "message": "TEST: For status update testing"
            }
        )
        
        assert response.status_code == 200, f"Failed to create test inquiry: {response.text}"
        data = response.json()
        assert "id" in data, f"Response should have 'id': {data}"
        return data["id"]
    
    def test_update_status_requires_auth(self, test_inquiry_id):
        """PUT without auth should return 401"""
        response = requests.put(
            f"{BASE_URL}/api/admin/inquiries/{test_inquiry_id}/status",
            json={"status": "responded"}
        )
        assert response.status_code == 401
        print("✅ Update status endpoint requires authentication")
    
    def test_update_status_to_responded(self, test_inquiry_id, admin_token):
        """PUT to mark inquiry as responded"""
        response = requests.put(
            f"{BASE_URL}/api/admin/inquiries/{test_inquiry_id}/status",
            headers={"Authorization": f"Bearer {admin_token}"},
            json={"status": "responded", "admin_notes": "TEST: Responded to customer via email"}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["message"] == "Inquiry marked as responded"
        print("✅ Inquiry marked as responded successfully")
        
        # Verify status change persisted
        verify_response = requests.get(
            f"{BASE_URL}/api/admin/inquiries",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        inquiries = verify_response.json()
        updated_inq = next((i for i in inquiries if i["id"] == test_inquiry_id), None)
        assert updated_inq is not None
        assert updated_inq["status"] == "responded"
        assert updated_inq["admin_notes"] == "TEST: Responded to customer via email"
        print("✅ Status and admin_notes persisted correctly")
    
    def test_update_status_to_archived(self, test_inquiry_id, admin_token):
        """PUT to archive an inquiry"""
        response = requests.put(
            f"{BASE_URL}/api/admin/inquiries/{test_inquiry_id}/status",
            headers={"Authorization": f"Bearer {admin_token}"},
            json={"status": "archived", "admin_notes": "TEST: Archived after resolution"}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["message"] == "Inquiry marked as archived"
        print("✅ Inquiry archived successfully")
        
        # Verify
        verify_response = requests.get(
            f"{BASE_URL}/api/admin/inquiries",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        inquiries = verify_response.json()
        updated_inq = next((i for i in inquiries if i["id"] == test_inquiry_id), None)
        assert updated_inq["status"] == "archived"
        print("✅ Archive status persisted")
    
    def test_reopen_inquiry_to_pending(self, test_inquiry_id, admin_token):
        """PUT to reopen (set back to pending) an inquiry"""
        response = requests.put(
            f"{BASE_URL}/api/admin/inquiries/{test_inquiry_id}/status",
            headers={"Authorization": f"Bearer {admin_token}"},
            json={"status": "pending", "admin_notes": "TEST: Reopened for follow-up"}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["message"] == "Inquiry marked as pending"
        print("✅ Inquiry reopened to pending successfully")
    
    def test_invalid_status_rejected(self, test_inquiry_id, admin_token):
        """PUT with invalid status should return 400"""
        response = requests.put(
            f"{BASE_URL}/api/admin/inquiries/{test_inquiry_id}/status",
            headers={"Authorization": f"Bearer {admin_token}"},
            json={"status": "invalid_status"}
        )
        assert response.status_code == 400
        print("✅ Invalid status correctly rejected with 400")
    
    def test_update_nonexistent_inquiry(self, admin_token):
        """PUT to non-existent inquiry returns 404"""
        response = requests.put(
            f"{BASE_URL}/api/admin/inquiries/nonexistent-id-12345/status",
            headers={"Authorization": f"Bearer {admin_token}"},
            json={"status": "responded"}
        )
        assert response.status_code == 404
        print("✅ Non-existent inquiry correctly returns 404")


class TestInquiryEnrichedUserDetails:
    """Test that admin inquiries include enriched user details"""
    
    def test_inquiry_has_user_details(self, admin_token):
        """Inquiries from registered users should have user details"""
        response = requests.get(
            f"{BASE_URL}/api/admin/inquiries",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        inquiries = response.json()
        
        # Find an inquiry with user_id (from registered user)
        user_inquiries = [i for i in inquiries if i.get("user_id")]
        
        if user_inquiries:
            inq = user_inquiries[0]
            # Should have enriched user fields
            assert "user_email" in inq or "email" in inq
            assert "user_company" in inq or "company_name" in inq
            print(f"✅ Inquiry has user details: email={inq.get('user_email') or inq.get('email')}, company={inq.get('user_company') or inq.get('company_name')}")
        else:
            print("⚠️ No inquiries from registered users found, skipping user detail check")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
