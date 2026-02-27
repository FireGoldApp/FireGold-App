"""
COA (Certificate of Analysis) Feature Tests
Tests for:
- PUT /api/strains/{id}/coa - admin upload COA PDF
- GET /api/strains/{id}/coa - authenticated users view COA
- DELETE /api/strains/{id}/coa - admin remove COA
- Strain coa_url field presence in responses
"""
import pytest
import requests
import os
import tempfile

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestCOAFeature:
    """Test COA (Certificate of Analysis) endpoints"""
    
    @pytest.fixture(scope="class")
    def admin_token(self):
        """Get admin authentication token"""
        response = requests.post(f"{BASE_URL}/api/admin/login", 
                                 json={"password": "firegold2026"})
        assert response.status_code == 200, f"Admin login failed: {response.text}"
        return response.json()["token"]
    
    @pytest.fixture(scope="class")
    def user_token(self):
        """Get user authentication token by logging in"""
        # First try to login with test user
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "testpwd@example.com",
            "password": "mypassword123"
        })
        if response.status_code == 200:
            return response.json()["token"]
        # If login fails, register a new user
        import uuid
        test_email = f"test_coa_{uuid.uuid4().hex[:8]}@example.com"
        response = requests.post(f"{BASE_URL}/api/auth/register", json={
            "first_name": "COA",
            "last_name": "Tester",
            "company": "TEST_COA_Company",
            "country": "Canada",
            "email": test_email,
            "phone": "+1-555-TEST-COA",
            "password": "testpass123"
        })
        assert response.status_code == 200, f"User registration failed: {response.text}"
        return response.json()["token"]
    
    @pytest.fixture(scope="class")
    def strain_with_coa(self, admin_token):
        """Get Jealousy strain which has COA uploaded"""
        response = requests.get(f"{BASE_URL}/api/strains/admin",
                               headers={"Authorization": f"Bearer {admin_token}"})
        assert response.status_code == 200
        strains = response.json()
        # Find Jealousy strain
        jealousy = next((s for s in strains if s['strain_name'] == 'Jealousy'), None)
        assert jealousy is not None, "Jealousy strain not found in database"
        return jealousy
    
    @pytest.fixture(scope="class")
    def strain_without_coa(self, admin_token):
        """Get a strain without COA"""
        response = requests.get(f"{BASE_URL}/api/strains/admin",
                               headers={"Authorization": f"Bearer {admin_token}"})
        assert response.status_code == 200
        strains = response.json()
        # Find a strain without COA
        no_coa = next((s for s in strains if not s.get('coa_url')), None)
        return no_coa
    
    # =====================================================
    # GET /api/strains/{id}/coa - View COA Tests
    # =====================================================
    
    def test_view_coa_success(self, user_token, strain_with_coa):
        """Test authenticated user can view COA PDF"""
        strain_id = strain_with_coa['id']
        response = requests.get(f"{BASE_URL}/api/strains/{strain_id}/coa",
                               headers={"Authorization": f"Bearer {user_token}"})
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        assert response.headers.get('content-type') == 'application/pdf', \
            f"Expected PDF content-type, got {response.headers.get('content-type')}"
        print(f"✅ GET /api/strains/{strain_id}/coa returns PDF (200)")
    
    def test_view_coa_requires_auth(self, strain_with_coa):
        """Test viewing COA requires user authentication"""
        strain_id = strain_with_coa['id']
        response = requests.get(f"{BASE_URL}/api/strains/{strain_id}/coa")
        
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("✅ GET /api/strains/{id}/coa returns 401 without auth")
    
    def test_view_coa_404_for_strain_without_coa(self, user_token, strain_without_coa):
        """Test viewing COA returns 404 for strains without COA"""
        if strain_without_coa is None:
            pytest.skip("No strain without COA found for testing")
        
        strain_id = strain_without_coa['id']
        response = requests.get(f"{BASE_URL}/api/strains/{strain_id}/coa",
                               headers={"Authorization": f"Bearer {user_token}"})
        
        assert response.status_code == 404, f"Expected 404, got {response.status_code}"
        data = response.json()
        assert "No COA available" in data.get('detail', ''), f"Unexpected error message: {data}"
        print(f"✅ GET /api/strains/{strain_id}/coa returns 404 (No COA available)")
    
    def test_view_coa_404_for_nonexistent_strain(self, user_token):
        """Test viewing COA returns 404 for non-existent strain"""
        response = requests.get(f"{BASE_URL}/api/strains/nonexistent-id/coa",
                               headers={"Authorization": f"Bearer {user_token}"})
        
        assert response.status_code == 404, f"Expected 404, got {response.status_code}"
        print("✅ GET /api/strains/nonexistent-id/coa returns 404")
    
    # =====================================================
    # PUT /api/strains/{id}/coa - Upload COA Tests
    # =====================================================
    
    def test_upload_coa_requires_admin(self, user_token, strain_without_coa):
        """Test uploading COA requires admin authentication"""
        if strain_without_coa is None:
            pytest.skip("No strain without COA found for testing")
        
        strain_id = strain_without_coa['id']
        
        # Create a dummy PDF file
        with tempfile.NamedTemporaryFile(suffix='.pdf', delete=False) as f:
            f.write(b'%PDF-1.4 test content')
            temp_path = f.name
        
        try:
            with open(temp_path, 'rb') as pdf_file:
                response = requests.put(
                    f"{BASE_URL}/api/strains/{strain_id}/coa",
                    headers={"Authorization": f"Bearer {user_token}"},
                    files={"coa": ("test.pdf", pdf_file, "application/pdf")}
                )
            
            # User token should not work for admin endpoint
            assert response.status_code == 401, f"Expected 401, got {response.status_code}"
            print("✅ PUT /api/strains/{id}/coa returns 401 with user token (admin required)")
        finally:
            os.unlink(temp_path)
    
    def test_upload_coa_success(self, admin_token, strain_without_coa):
        """Test admin can upload COA PDF"""
        if strain_without_coa is None:
            pytest.skip("No strain without COA found for testing")
        
        strain_id = strain_without_coa['id']
        
        # Create a dummy PDF file
        with tempfile.NamedTemporaryFile(suffix='.pdf', delete=False) as f:
            f.write(b'%PDF-1.4 test COA content')
            temp_path = f.name
        
        try:
            with open(temp_path, 'rb') as pdf_file:
                response = requests.put(
                    f"{BASE_URL}/api/strains/{strain_id}/coa",
                    headers={"Authorization": f"Bearer {admin_token}"},
                    files={"coa": ("test_coa.pdf", pdf_file, "application/pdf")}
                )
            
            assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
            data = response.json()
            assert "coa_url" in data, f"Response should contain coa_url: {data}"
            assert data['coa_url'] is not None, "coa_url should not be None"
            print(f"✅ PUT /api/strains/{strain_id}/coa uploads COA successfully")
        finally:
            os.unlink(temp_path)
    
    def test_upload_coa_rejects_non_pdf(self, admin_token, strain_without_coa):
        """Test COA upload rejects non-PDF files"""
        if strain_without_coa is None:
            pytest.skip("No strain without COA found for testing")
        
        strain_id = strain_without_coa['id']
        
        # Create a non-PDF file
        with tempfile.NamedTemporaryFile(suffix='.txt', delete=False) as f:
            f.write(b'This is not a PDF')
            temp_path = f.name
        
        try:
            with open(temp_path, 'rb') as txt_file:
                response = requests.put(
                    f"{BASE_URL}/api/strains/{strain_id}/coa",
                    headers={"Authorization": f"Bearer {admin_token}"},
                    files={"coa": ("test.txt", txt_file, "text/plain")}
                )
            
            assert response.status_code == 400, f"Expected 400, got {response.status_code}"
            data = response.json()
            assert "PDF" in data.get('detail', ''), f"Error should mention PDF: {data}"
            print("✅ PUT /api/strains/{id}/coa rejects non-PDF files (400)")
        finally:
            os.unlink(temp_path)
    
    def test_upload_coa_404_for_nonexistent_strain(self, admin_token):
        """Test COA upload returns 404 for non-existent strain"""
        with tempfile.NamedTemporaryFile(suffix='.pdf', delete=False) as f:
            f.write(b'%PDF-1.4 test content')
            temp_path = f.name
        
        try:
            with open(temp_path, 'rb') as pdf_file:
                response = requests.put(
                    f"{BASE_URL}/api/strains/nonexistent-strain-id/coa",
                    headers={"Authorization": f"Bearer {admin_token}"},
                    files={"coa": ("test.pdf", pdf_file, "application/pdf")}
                )
            
            assert response.status_code == 404, f"Expected 404, got {response.status_code}"
            print("✅ PUT /api/strains/nonexistent-id/coa returns 404")
        finally:
            os.unlink(temp_path)
    
    # =====================================================
    # DELETE /api/strains/{id}/coa - Remove COA Tests
    # =====================================================
    
    def test_delete_coa_requires_admin(self, user_token, strain_with_coa):
        """Test deleting COA requires admin authentication"""
        strain_id = strain_with_coa['id']
        response = requests.delete(f"{BASE_URL}/api/strains/{strain_id}/coa",
                                  headers={"Authorization": f"Bearer {user_token}"})
        
        # User token should not work for admin endpoint
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("✅ DELETE /api/strains/{id}/coa returns 401 with user token (admin required)")
    
    def test_delete_coa_404_for_nonexistent_strain(self, admin_token):
        """Test COA delete returns 404 for non-existent strain"""
        response = requests.delete(f"{BASE_URL}/api/strains/nonexistent-strain-id/coa",
                                  headers={"Authorization": f"Bearer {admin_token}"})
        
        assert response.status_code == 404, f"Expected 404, got {response.status_code}"
        print("✅ DELETE /api/strains/nonexistent-id/coa returns 404")
    
    # =====================================================
    # Strain Response Contains coa_url Field
    # =====================================================
    
    def test_strain_list_includes_coa_url(self, admin_token):
        """Test strain list endpoint includes coa_url field"""
        response = requests.get(f"{BASE_URL}/api/strains/admin",
                               headers={"Authorization": f"Bearer {admin_token}"})
        
        assert response.status_code == 200
        strains = response.json()
        assert len(strains) > 0, "No strains found"
        
        # Check that strains have coa_url field (can be null or string)
        for strain in strains:
            assert 'coa_url' in strain or strain.get('coa_url') is None, \
                f"Strain {strain.get('strain_name')} missing coa_url field"
        
        # Verify Jealousy has coa_url
        jealousy = next((s for s in strains if s['strain_name'] == 'Jealousy'), None)
        assert jealousy is not None, "Jealousy strain not found"
        assert jealousy.get('coa_url') is not None, "Jealousy should have coa_url"
        print(f"✅ Strain list includes coa_url field (Jealousy has: {jealousy['coa_url']})")


class TestCOAIntegration:
    """Integration tests for COA workflow"""
    
    @pytest.fixture(scope="class")
    def admin_token(self):
        """Get admin authentication token"""
        response = requests.post(f"{BASE_URL}/api/admin/login", 
                                 json={"password": "firegold2026"})
        assert response.status_code == 200
        return response.json()["token"]
    
    @pytest.fixture(scope="class")
    def user_token(self):
        """Get user authentication token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "testpwd@example.com",
            "password": "mypassword123"
        })
        if response.status_code == 200:
            return response.json()["token"]
        # Register if not exists
        import uuid
        test_email = f"test_coa_int_{uuid.uuid4().hex[:8]}@example.com"
        response = requests.post(f"{BASE_URL}/api/auth/register", json={
            "first_name": "COA",
            "last_name": "Integration",
            "company": "TEST_COA_Int_Company",
            "country": "Canada",
            "email": test_email,
            "phone": "+1-555-INT-COA",
            "password": "testpass123"
        })
        return response.json()["token"]
    
    def test_full_coa_workflow(self, admin_token, user_token):
        """Test full COA upload -> view -> delete workflow on a test strain"""
        # Get a strain without COA to test the full workflow
        response = requests.get(f"{BASE_URL}/api/strains/admin",
                               headers={"Authorization": f"Bearer {admin_token}"})
        strains = response.json()
        
        # Find AIS or another strain without COA
        test_strain = next((s for s in strains if s['strain_name'] == 'AIS'), None)
        if test_strain is None or test_strain.get('coa_url'):
            # Use any strain without COA
            test_strain = next((s for s in strains if not s.get('coa_url') and s['strain_name'] != 'Jealousy'), None)
        
        if test_strain is None:
            pytest.skip("No suitable strain without COA for integration test")
        
        strain_id = test_strain['id']
        strain_name = test_strain['strain_name']
        print(f"Testing COA workflow on strain: {strain_name} ({strain_id})")
        
        # Step 1: Verify strain doesn't have COA
        response = requests.get(f"{BASE_URL}/api/strains/{strain_id}/coa",
                               headers={"Authorization": f"Bearer {user_token}"})
        assert response.status_code == 404, "Strain should not have COA initially"
        print(f"  1. Verified {strain_name} has no COA (404)")
        
        # Step 2: Admin uploads COA
        with tempfile.NamedTemporaryFile(suffix='.pdf', delete=False) as f:
            f.write(b'%PDF-1.4 Test COA for integration test')
            temp_path = f.name
        
        try:
            with open(temp_path, 'rb') as pdf_file:
                response = requests.put(
                    f"{BASE_URL}/api/strains/{strain_id}/coa",
                    headers={"Authorization": f"Bearer {admin_token}"},
                    files={"coa": ("integration_test_coa.pdf", pdf_file, "application/pdf")}
                )
            assert response.status_code == 200, f"COA upload failed: {response.text}"
            print(f"  2. Admin uploaded COA successfully")
            
            # Step 3: Verify strain now shows coa_url
            response = requests.get(f"{BASE_URL}/api/strains/admin",
                                   headers={"Authorization": f"Bearer {admin_token}"})
            strains = response.json()
            updated_strain = next((s for s in strains if s['id'] == strain_id), None)
            assert updated_strain is not None
            assert updated_strain.get('coa_url') is not None, "Strain should now have coa_url"
            print(f"  3. Verified strain has coa_url: {updated_strain['coa_url']}")
            
            # Step 4: User can view COA
            response = requests.get(f"{BASE_URL}/api/strains/{strain_id}/coa",
                                   headers={"Authorization": f"Bearer {user_token}"})
            assert response.status_code == 200, f"User should be able to view COA: {response.status_code}"
            assert response.headers.get('content-type') == 'application/pdf'
            print(f"  4. User can view COA (returns PDF)")
            
            # Step 5: Admin removes COA
            response = requests.delete(f"{BASE_URL}/api/strains/{strain_id}/coa",
                                      headers={"Authorization": f"Bearer {admin_token}"})
            assert response.status_code == 200, f"COA delete failed: {response.text}"
            print(f"  5. Admin removed COA successfully")
            
            # Step 6: Verify COA is removed
            response = requests.get(f"{BASE_URL}/api/strains/{strain_id}/coa",
                                   headers={"Authorization": f"Bearer {user_token}"})
            assert response.status_code == 404, "COA should be removed"
            print(f"  6. Verified COA is removed (404)")
            
            print(f"✅ Full COA workflow test passed for {strain_name}")
            
        finally:
            os.unlink(temp_path)


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
