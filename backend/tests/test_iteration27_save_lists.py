"""
Iteration 27 - Save List Feature Tests
Tests for:
- POST /api/user/lists - Create a saved list with strain IDs
- GET /api/user/lists - Get user's saved lists
- DELETE /api/user/lists/{id} - Delete a list
- GET /api/user/lists/{id}/csv - Download list as CSV
- GET /api/admin/lists - Get all saved lists (admin only)
- GET /api/admin/lists/analytics - Get analytics with top_strains, top_effects, category_breakdown
"""

import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://strain-effects.preview.emergentagent.com')

# Test credentials
TEST_USER_EMAIL = "test_savelist@test.com"
TEST_USER_PASSWORD = "Test1234!"
ADMIN_PASSWORD = "firegold2026"


class TestSetup:
    """Setup fixtures for testing"""
    
    @pytest.fixture(scope="class")
    def user_token(self):
        """Create or login test user and return token"""
        # Try to login first
        login_resp = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_USER_EMAIL,
            "password": TEST_USER_PASSWORD
        })
        
        if login_resp.status_code == 200:
            return login_resp.json().get("token")
        
        # Register new user if login fails
        register_resp = requests.post(f"{BASE_URL}/api/auth/register", json={
            "first_name": "Test",
            "last_name": "SaveList",
            "company": "TEST_SaveListCo",
            "country": "Canada",
            "email": TEST_USER_EMAIL,
            "phone": "+1 555-SAVELIST",
            "password": TEST_USER_PASSWORD
        })
        
        if register_resp.status_code == 200:
            return register_resp.json().get("token")
        
        pytest.skip(f"Unable to authenticate test user: {register_resp.text}")
    
    @pytest.fixture(scope="class")
    def admin_token(self):
        """Get admin token"""
        resp = requests.post(f"{BASE_URL}/api/admin/login", json={
            "password": ADMIN_PASSWORD
        })
        
        if resp.status_code == 200:
            return resp.json().get("token")
        
        pytest.skip("Unable to authenticate admin")
    
    @pytest.fixture(scope="class")
    def strain_ids(self, user_token):
        """Get some strain IDs to use in tests"""
        resp = requests.get(f"{BASE_URL}/api/strains", headers={
            "Authorization": f"Bearer {user_token}"
        })
        
        if resp.status_code == 200:
            strains = resp.json()
            if len(strains) >= 3:
                return [s["id"] for s in strains[:3]]
        
        pytest.skip("Unable to fetch strains for testing")


class TestUserListsCRUD(TestSetup):
    """Tests for user saved lists CRUD operations"""
    
    created_list_id = None
    
    def test_create_saved_list(self, user_token, strain_ids):
        """POST /api/user/lists - Create a saved list with strain IDs"""
        response = requests.post(
            f"{BASE_URL}/api/user/lists",
            json={
                "list_name": "TEST_My Test List",
                "strain_ids": strain_ids,
                "filters_applied": {"type": "Hybrid", "category": "Dried Flower"}
            },
            headers={"Authorization": f"Bearer {user_token}"}
        )
        
        assert response.status_code == 200, f"Create list failed: {response.text}"
        data = response.json()
        
        # Verify response structure
        assert "id" in data, "Response should contain list id"
        assert data["list_name"] == "TEST_My Test List"
        assert data["strain_count"] == len(strain_ids)
        assert "strain_names" in data, "Response should contain strain_names"
        assert "created_at" in data
        
        # Store for later tests
        TestUserListsCRUD.created_list_id = data["id"]
        print(f"✅ Created saved list with ID: {data['id']}, contains {len(data['strain_names'])} strains")
    
    def test_get_user_lists(self, user_token):
        """GET /api/user/lists - Get user's saved lists"""
        response = requests.get(
            f"{BASE_URL}/api/user/lists",
            headers={"Authorization": f"Bearer {user_token}"}
        )
        
        assert response.status_code == 200, f"Get lists failed: {response.text}"
        data = response.json()
        
        # Should be a list
        assert isinstance(data, list), "Response should be a list"
        
        # Find our test list
        test_lists = [lst for lst in data if lst.get("list_name", "").startswith("TEST_")]
        assert len(test_lists) > 0, "Should find at least one TEST_ list"
        
        # Verify list structure
        test_list = test_lists[0]
        assert "id" in test_list
        assert "list_name" in test_list
        assert "strain_count" in test_list
        assert "strain_names" in test_list
        assert "created_at" in test_list
        
        print(f"✅ Retrieved {len(data)} saved lists, found {len(test_lists)} test lists")
    
    def test_download_list_csv(self, user_token):
        """GET /api/user/lists/{id}/csv - Download list as CSV"""
        if not TestUserListsCRUD.created_list_id:
            pytest.skip("No list ID available from create test")
        
        response = requests.get(
            f"{BASE_URL}/api/user/lists/{TestUserListsCRUD.created_list_id}/csv",
            headers={"Authorization": f"Bearer {user_token}"}
        )
        
        assert response.status_code == 200, f"CSV download failed: {response.text}"
        
        # Check content type
        content_type = response.headers.get("content-type", "")
        assert "text/csv" in content_type, f"Expected CSV content type, got: {content_type}"
        
        # Check content disposition header
        content_disposition = response.headers.get("content-disposition", "")
        assert "attachment" in content_disposition, "Should be an attachment download"
        assert ".csv" in content_disposition or "csv" in content_disposition.lower(), "Filename should have .csv"
        
        # Verify CSV content
        csv_content = response.text
        assert "Strain Name" in csv_content, "CSV should have Strain Name header"
        assert "THC %" in csv_content, "CSV should have THC % header"
        assert "Effects" in csv_content, "CSV should have Effects header"
        
        print(f"✅ Downloaded CSV with {len(csv_content)} bytes, headers verified")
    
    def test_delete_saved_list(self, user_token):
        """DELETE /api/user/lists/{id} - Delete a list"""
        if not TestUserListsCRUD.created_list_id:
            pytest.skip("No list ID available from create test")
        
        response = requests.delete(
            f"{BASE_URL}/api/user/lists/{TestUserListsCRUD.created_list_id}",
            headers={"Authorization": f"Bearer {user_token}"}
        )
        
        assert response.status_code == 200, f"Delete list failed: {response.text}"
        data = response.json()
        assert "message" in data
        assert "deleted" in data["message"].lower()
        
        # Verify list is actually deleted
        get_resp = requests.get(
            f"{BASE_URL}/api/user/lists",
            headers={"Authorization": f"Bearer {user_token}"}
        )
        
        lists = get_resp.json()
        deleted_list = [lst for lst in lists if lst.get("id") == TestUserListsCRUD.created_list_id]
        assert len(deleted_list) == 0, "Deleted list should not appear in user lists"
        
        print(f"✅ Deleted list {TestUserListsCRUD.created_list_id} and verified removal")


class TestUserListsAuth(TestSetup):
    """Test authentication requirements for user lists endpoints"""
    
    def test_create_list_requires_auth(self, strain_ids):
        """POST /api/user/lists without auth should fail"""
        response = requests.post(
            f"{BASE_URL}/api/user/lists",
            json={
                "list_name": "Unauthorized List",
                "strain_ids": strain_ids
            }
        )
        
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("✅ Create list correctly requires authentication")
    
    def test_get_lists_requires_auth(self):
        """GET /api/user/lists without auth should fail"""
        response = requests.get(f"{BASE_URL}/api/user/lists")
        
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("✅ Get lists correctly requires authentication")
    
    def test_csv_download_requires_auth(self):
        """GET /api/user/lists/{id}/csv without auth should fail"""
        response = requests.get(f"{BASE_URL}/api/user/lists/some-id/csv")
        
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("✅ CSV download correctly requires authentication")


class TestAdminListsEndpoints(TestSetup):
    """Tests for admin lists endpoints"""
    
    def test_admin_get_all_lists(self, admin_token):
        """GET /api/admin/lists - Admin can view all user-saved lists"""
        response = requests.get(
            f"{BASE_URL}/api/admin/lists",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        
        assert response.status_code == 200, f"Admin get lists failed: {response.text}"
        data = response.json()
        
        # Should be a list
        assert isinstance(data, list), "Response should be a list of all user lists"
        
        print(f"✅ Admin retrieved {len(data)} total saved lists")
    
    def test_admin_lists_analytics(self, admin_token):
        """GET /api/admin/lists/analytics - Get analytics with top_strains, top_effects, category_breakdown"""
        response = requests.get(
            f"{BASE_URL}/api/admin/lists/analytics",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        
        assert response.status_code == 200, f"Admin analytics failed: {response.text}"
        data = response.json()
        
        # Verify analytics structure
        assert "total_lists" in data, "Should have total_lists"
        assert "total_saves" in data, "Should have total_saves"
        assert "unique_users" in data, "Should have unique_users"
        assert "top_strains" in data, "Should have top_strains"
        assert "top_effects" in data, "Should have top_effects"
        assert "category_breakdown" in data, "Should have category_breakdown"
        
        # Verify types
        assert isinstance(data["total_lists"], int), "total_lists should be int"
        assert isinstance(data["total_saves"], int), "total_saves should be int"
        assert isinstance(data["unique_users"], int), "unique_users should be int"
        assert isinstance(data["top_strains"], list), "top_strains should be list"
        assert isinstance(data["top_effects"], list), "top_effects should be list"
        assert isinstance(data["category_breakdown"], list), "category_breakdown should be list"
        
        print(f"✅ Analytics: {data['total_lists']} lists, {data['total_saves']} saves, {data['unique_users']} users")
        
        if data["top_strains"]:
            print(f"   Top strain: {data['top_strains'][0].get('strain_name')} with {data['top_strains'][0].get('save_count')} saves")
    
    def test_admin_lists_requires_admin_auth(self):
        """GET /api/admin/lists without admin auth should fail"""
        response = requests.get(f"{BASE_URL}/api/admin/lists")
        
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("✅ Admin lists endpoint correctly requires admin authentication")
    
    def test_admin_analytics_requires_admin_auth(self):
        """GET /api/admin/lists/analytics without admin auth should fail"""
        response = requests.get(f"{BASE_URL}/api/admin/lists/analytics")
        
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("✅ Admin analytics endpoint correctly requires admin authentication")


class TestSaveListDataPersistence(TestSetup):
    """Test data persistence and integrity"""
    
    def test_create_list_and_verify_persistence(self, user_token, strain_ids):
        """Create a list, then GET to verify it was saved correctly"""
        list_name = "TEST_Persistence Check List"
        
        # Create the list
        create_resp = requests.post(
            f"{BASE_URL}/api/user/lists",
            json={
                "list_name": list_name,
                "strain_ids": strain_ids[:2],  # Use first 2 strains
                "filters_applied": {"minThc": 25}
            },
            headers={"Authorization": f"Bearer {user_token}"}
        )
        
        assert create_resp.status_code == 200
        created = create_resp.json()
        list_id = created["id"]
        
        # Fetch all lists and verify our list is there
        get_resp = requests.get(
            f"{BASE_URL}/api/user/lists",
            headers={"Authorization": f"Bearer {user_token}"}
        )
        
        assert get_resp.status_code == 200
        all_lists = get_resp.json()
        
        # Find our list
        our_list = next((lst for lst in all_lists if lst["id"] == list_id), None)
        assert our_list is not None, "Created list should be in user's lists"
        
        # Verify data persisted correctly
        assert our_list["list_name"] == list_name
        assert our_list["strain_count"] == 2
        assert len(our_list["strain_names"]) == 2
        
        # Cleanup
        requests.delete(
            f"{BASE_URL}/api/user/lists/{list_id}",
            headers={"Authorization": f"Bearer {user_token}"}
        )
        
        print(f"✅ Created list persisted correctly with {our_list['strain_count']} strains")


class TestEdgeCases(TestSetup):
    """Test edge cases and error handling"""
    
    def test_delete_nonexistent_list(self, user_token):
        """DELETE /api/user/lists/{id} with invalid ID should return 404"""
        response = requests.delete(
            f"{BASE_URL}/api/user/lists/nonexistent-id-12345",
            headers={"Authorization": f"Bearer {user_token}"}
        )
        
        assert response.status_code == 404, f"Expected 404 for non-existent list, got {response.status_code}"
        print("✅ Delete nonexistent list correctly returns 404")
    
    def test_csv_download_nonexistent_list(self, user_token):
        """GET /api/user/lists/{id}/csv with invalid ID should return 404"""
        response = requests.get(
            f"{BASE_URL}/api/user/lists/nonexistent-id-12345/csv",
            headers={"Authorization": f"Bearer {user_token}"}
        )
        
        assert response.status_code == 404, f"Expected 404 for non-existent list, got {response.status_code}"
        print("✅ CSV download nonexistent list correctly returns 404")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
