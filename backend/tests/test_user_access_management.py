"""
Test suite for User Access Management Features:
- PUT /api/admin/users/{user_id}/status (pause/restore user access)
- DELETE /api/admin/users/{user_id} (remove user)
- Login blocked for suspended/removed users with contact message
- Active tokens invalidated when user is suspended/removed
"""

import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Admin and test user credentials
ADMIN_PASSWORD = "firegold2026"
TEST_USER_EMAIL = "mobiletest@example.com"
TEST_USER_PASSWORD = "Test1234"

class TestUserAccessManagement:
    """User access management endpoint tests"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup admin token and test user"""
        self.admin_token = None
        self.test_user_id = None
        self.test_user_token = None
        
        # Get admin token
        response = requests.post(f"{BASE_URL}/api/admin/login", json={"password": ADMIN_PASSWORD})
        if response.status_code == 200:
            self.admin_token = response.json().get("token")
        
        # Get test user ID from users list
        if self.admin_token:
            users_response = requests.get(
                f"{BASE_URL}/api/auth/users",
                headers={"Authorization": f"Bearer {self.admin_token}"}
            )
            if users_response.status_code == 200:
                users = users_response.json()
                for user in users:
                    if user.get("email") == TEST_USER_EMAIL:
                        self.test_user_id = user.get("id")
                        break
        
        yield
        
        # Cleanup: Always restore user to active status after tests
        if self.admin_token and self.test_user_id:
            requests.put(
                f"{BASE_URL}/api/admin/users/{self.test_user_id}/status",
                json={"status": "active"},
                headers={"Authorization": f"Bearer {self.admin_token}"}
            )
    
    def test_admin_login(self):
        """Test admin login works"""
        response = requests.post(f"{BASE_URL}/api/admin/login", json={"password": ADMIN_PASSWORD})
        assert response.status_code == 200
        data = response.json()
        assert "token" in data
        print("✅ Admin login successful")
    
    def test_get_users_requires_admin(self):
        """Test that getting users requires admin authentication"""
        response = requests.get(f"{BASE_URL}/api/auth/users")
        assert response.status_code == 401
        print("✅ Get users requires admin authentication")
    
    def test_get_users_with_admin_token(self):
        """Test that admin can get users list"""
        assert self.admin_token is not None, "Admin token not available"
        
        response = requests.get(
            f"{BASE_URL}/api/auth/users",
            headers={"Authorization": f"Bearer {self.admin_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        
        # Verify user data structure
        if len(data) > 0:
            user = data[0]
            assert "id" in user
            assert "email" in user
            assert "first_name" in user
            # Should not include password_hash
            assert "password_hash" not in user
        
        print(f"✅ Got {len(data)} users from API")
    
    def test_test_user_exists(self):
        """Verify test user exists"""
        assert self.test_user_id is not None, f"Test user {TEST_USER_EMAIL} not found"
        print(f"✅ Test user found with ID: {self.test_user_id}")
    
    def test_user_can_login_initially(self):
        """Test user can login when status is active"""
        # First ensure user is active
        if self.admin_token and self.test_user_id:
            requests.put(
                f"{BASE_URL}/api/admin/users/{self.test_user_id}/status",
                json={"status": "active"},
                headers={"Authorization": f"Bearer {self.admin_token}"}
            )
        
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_USER_EMAIL,
            "password": TEST_USER_PASSWORD
        })
        assert response.status_code == 200
        data = response.json()
        assert "token" in data
        assert "user" in data
        assert data["user"]["email"] == TEST_USER_EMAIL
        self.test_user_token = data.get("token")
        print("✅ User can login when active")
    
    def test_pause_user_access(self):
        """Test PUT /api/admin/users/{user_id}/status with status=suspended"""
        assert self.admin_token is not None, "Admin token not available"
        assert self.test_user_id is not None, "Test user ID not available"
        
        response = requests.put(
            f"{BASE_URL}/api/admin/users/{self.test_user_id}/status",
            json={"status": "suspended"},
            headers={"Authorization": f"Bearer {self.admin_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        assert "suspended" in data["message"]
        print("✅ User access paused successfully")
    
    def test_suspended_user_cannot_login(self):
        """Test login attempt by suspended user returns 403 with contact email"""
        assert self.admin_token is not None, "Admin token not available"
        assert self.test_user_id is not None, "Test user ID not available"
        
        # Suspend the user
        requests.put(
            f"{BASE_URL}/api/admin/users/{self.test_user_id}/status",
            json={"status": "suspended"},
            headers={"Authorization": f"Bearer {self.admin_token}"}
        )
        
        # Try to login
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_USER_EMAIL,
            "password": TEST_USER_PASSWORD
        })
        assert response.status_code == 403, f"Expected 403, got {response.status_code}"
        data = response.json()
        assert "detail" in data
        assert "warren@firegold.ca" in data["detail"], "Contact email not in error message"
        assert "paused" in data["detail"].lower(), "Error message should mention 'paused'"
        print(f"✅ Suspended user login blocked with message: {data['detail']}")
    
    def test_restore_user_access(self):
        """Test PUT /api/admin/users/{user_id}/status with status=active restores access"""
        assert self.admin_token is not None, "Admin token not available"
        assert self.test_user_id is not None, "Test user ID not available"
        
        # First suspend the user
        requests.put(
            f"{BASE_URL}/api/admin/users/{self.test_user_id}/status",
            json={"status": "suspended"},
            headers={"Authorization": f"Bearer {self.admin_token}"}
        )
        
        # Restore user
        response = requests.put(
            f"{BASE_URL}/api/admin/users/{self.test_user_id}/status",
            json={"status": "active"},
            headers={"Authorization": f"Bearer {self.admin_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        assert "active" in data["message"]
        print("✅ User access restored successfully")
    
    def test_restored_user_can_login(self):
        """Test that restored user can login again"""
        assert self.admin_token is not None, "Admin token not available"
        assert self.test_user_id is not None, "Test user ID not available"
        
        # Restore user to active
        requests.put(
            f"{BASE_URL}/api/admin/users/{self.test_user_id}/status",
            json={"status": "active"},
            headers={"Authorization": f"Bearer {self.admin_token}"}
        )
        
        # Try login
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_USER_EMAIL,
            "password": TEST_USER_PASSWORD
        })
        assert response.status_code == 200
        data = response.json()
        assert "token" in data
        print("✅ Restored user can login successfully")
    
    def test_invalid_status_rejected(self):
        """Test that invalid status values are rejected"""
        assert self.admin_token is not None, "Admin token not available"
        assert self.test_user_id is not None, "Test user ID not available"
        
        response = requests.put(
            f"{BASE_URL}/api/admin/users/{self.test_user_id}/status",
            json={"status": "invalid_status"},
            headers={"Authorization": f"Bearer {self.admin_token}"}
        )
        assert response.status_code == 400
        data = response.json()
        assert "detail" in data
        print("✅ Invalid status correctly rejected")
    
    def test_status_update_requires_admin(self):
        """Test that status update requires admin authentication"""
        response = requests.put(
            f"{BASE_URL}/api/admin/users/test-id/status",
            json={"status": "suspended"}
        )
        assert response.status_code == 401
        print("✅ Status update requires admin authentication")
    
    def test_status_update_nonexistent_user(self):
        """Test status update for non-existent user returns 404"""
        assert self.admin_token is not None, "Admin token not available"
        
        response = requests.put(
            f"{BASE_URL}/api/admin/users/nonexistent-user-id-12345/status",
            json={"status": "suspended"},
            headers={"Authorization": f"Bearer {self.admin_token}"}
        )
        assert response.status_code == 404
        print("✅ Status update for non-existent user returns 404")


class TestRemoveUser:
    """Tests for DELETE /api/admin/users/{user_id} endpoint"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup admin token"""
        self.admin_token = None
        self.new_user_id = None
        
        # Get admin token
        response = requests.post(f"{BASE_URL}/api/admin/login", json={"password": ADMIN_PASSWORD})
        if response.status_code == 200:
            self.admin_token = response.json().get("token")
        
        yield
        
        # Cleanup: If we created a test user, try to clean up
        pass
    
    def test_remove_user_requires_admin(self):
        """Test that DELETE user requires admin authentication"""
        response = requests.delete(f"{BASE_URL}/api/admin/users/test-id")
        assert response.status_code == 401
        print("✅ Remove user requires admin authentication")
    
    def test_remove_nonexistent_user(self):
        """Test remove non-existent user returns 404"""
        assert self.admin_token is not None, "Admin token not available"
        
        response = requests.delete(
            f"{BASE_URL}/api/admin/users/nonexistent-user-id-12345",
            headers={"Authorization": f"Bearer {self.admin_token}"}
        )
        assert response.status_code == 404
        print("✅ Remove non-existent user returns 404")


class TestRemovedUserLogin:
    """Tests for removed user login blocking"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup - create and remove a temporary test user"""
        self.admin_token = None
        self.temp_user_email = "TEST_tempremove@example.com"
        self.temp_user_password = "TempPass123"
        self.temp_user_id = None
        
        # Get admin token
        response = requests.post(f"{BASE_URL}/api/admin/login", json={"password": ADMIN_PASSWORD})
        if response.status_code == 200:
            self.admin_token = response.json().get("token")
        
        # Create a temporary user for testing removal
        register_response = requests.post(f"{BASE_URL}/api/auth/register", json={
            "first_name": "Temp",
            "last_name": "Remove",
            "company": "TEST Removal Company",
            "country": "Canada",
            "email": self.temp_user_email,
            "phone": "+1-555-TEMP-001",
            "password": self.temp_user_password
        })
        
        if register_response.status_code == 200:
            data = register_response.json()
            if "user" in data:
                self.temp_user_id = data["user"].get("id")
        
        yield
        
        # No cleanup needed - user is marked as removed (not deleted)
    
    def test_removed_user_cannot_login(self):
        """Test login attempt by removed user returns 403 with contact email"""
        if not self.admin_token or not self.temp_user_id:
            pytest.skip("Could not setup temp user for removal test")
        
        # Remove the user
        remove_response = requests.delete(
            f"{BASE_URL}/api/admin/users/{self.temp_user_id}",
            headers={"Authorization": f"Bearer {self.admin_token}"}
        )
        assert remove_response.status_code == 200, f"Failed to remove user: {remove_response.text}"
        
        # Try to login
        login_response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": self.temp_user_email,
            "password": self.temp_user_password
        })
        assert login_response.status_code == 403, f"Expected 403, got {login_response.status_code}"
        data = login_response.json()
        assert "detail" in data
        assert "warren@firegold.ca" in data["detail"], f"Contact email not in error: {data['detail']}"
        assert "removed" in data["detail"].lower(), f"Error should mention 'removed': {data['detail']}"
        print(f"✅ Removed user login blocked with message: {data['detail']}")


class TestTokenInvalidation:
    """Tests for token invalidation when user is suspended/removed"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup admin token and get test user token"""
        self.admin_token = None
        self.test_user_id = None
        
        # Get admin token
        response = requests.post(f"{BASE_URL}/api/admin/login", json={"password": ADMIN_PASSWORD})
        if response.status_code == 200:
            self.admin_token = response.json().get("token")
        
        # Get test user ID
        if self.admin_token:
            users_response = requests.get(
                f"{BASE_URL}/api/auth/users",
                headers={"Authorization": f"Bearer {self.admin_token}"}
            )
            if users_response.status_code == 200:
                users = users_response.json()
                for user in users:
                    if user.get("email") == TEST_USER_EMAIL:
                        self.test_user_id = user.get("id")
                        break
        
        yield
        
        # Cleanup: Always restore user to active
        if self.admin_token and self.test_user_id:
            requests.put(
                f"{BASE_URL}/api/admin/users/{self.test_user_id}/status",
                json={"status": "active"},
                headers={"Authorization": f"Bearer {self.admin_token}"}
            )
    
    def test_token_invalidation_on_suspend(self):
        """Test that suspending a user invalidates their active tokens"""
        assert self.admin_token is not None, "Admin token not available"
        assert self.test_user_id is not None, "Test user ID not available"
        
        # First restore user and get a fresh token
        requests.put(
            f"{BASE_URL}/api/admin/users/{self.test_user_id}/status",
            json={"status": "active"},
            headers={"Authorization": f"Bearer {self.admin_token}"}
        )
        
        login_response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_USER_EMAIL,
            "password": TEST_USER_PASSWORD
        })
        assert login_response.status_code == 200
        user_token = login_response.json().get("token")
        assert user_token is not None
        
        # Verify token works
        verify_response = requests.get(
            f"{BASE_URL}/api/auth/verify",
            headers={"Authorization": f"Bearer {user_token}"}
        )
        assert verify_response.status_code == 200, "Token should work before suspension"
        
        # Suspend the user
        suspend_response = requests.put(
            f"{BASE_URL}/api/admin/users/{self.test_user_id}/status",
            json={"status": "suspended"},
            headers={"Authorization": f"Bearer {self.admin_token}"}
        )
        assert suspend_response.status_code == 200
        
        # Verify token is now invalid
        verify_after_response = requests.get(
            f"{BASE_URL}/api/auth/verify",
            headers={"Authorization": f"Bearer {user_token}"}
        )
        # Token should be invalidated (401) after suspension
        assert verify_after_response.status_code == 401, f"Token should be invalidated after suspension, got {verify_after_response.status_code}"
        print("✅ User token invalidated after suspension")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
