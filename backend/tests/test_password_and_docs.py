"""
Test file for iteration 4:
1. User-chosen password at registration (replaces temp password)
2. COA/Health Canada License/CRA License PDF uploads on grower form
3. Admin submissions tab document links
"""
import pytest
import requests
import os
import io

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')
ADMIN_PASSWORD = "firegold2026"


# ===== AUTHENTICATION / PASSWORD TESTS =====
class TestUserChosenPassword:
    """Test user-chosen password registration feature"""

    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup test data"""
        self.test_email = f"test_pwd_{os.urandom(4).hex()}@example.com"
        self.test_password = "MySecurePassword123"
        
    def test_register_with_password_field(self):
        """POST /api/auth/register requires password field"""
        response = requests.post(f"{BASE_URL}/api/auth/register", json={
            "first_name": "Test",
            "last_name": "PasswordUser",
            "company": "TEST_PasswordCo",
            "country": "Canada",
            "email": self.test_email,
            "phone": "+1-555-0199",
            "password": self.test_password
        })
        assert response.status_code == 200, f"Registration failed: {response.text}"
        data = response.json()
        
        # Verify response has token but NO temp_password
        assert "token" in data, "Response should contain token"
        assert "temp_password" not in data, "Response should NOT contain temp_password anymore"
        assert "user" in data
        assert data["user"]["email"] == self.test_email.lower()
        print(f"✅ Registration with password field works. No temp_password in response.")

    def test_register_without_password_fails(self):
        """POST /api/auth/register should fail without password field"""
        response = requests.post(f"{BASE_URL}/api/auth/register", json={
            "first_name": "Test",
            "last_name": "NoPassword",
            "company": "TEST_NoPwdCo",
            "country": "Canada",
            "email": f"test_nopwd_{os.urandom(4).hex()}@example.com",
            "phone": "+1-555-0198"
            # Missing password field
        })
        # Should fail with 422 (validation error)
        assert response.status_code == 422, f"Should fail without password. Got: {response.status_code}"
        print(f"✅ Registration correctly requires password field")

    def test_login_with_chosen_password(self):
        """User can login with their chosen password"""
        # First register
        unique_email = f"test_login_{os.urandom(4).hex()}@example.com"
        chosen_pwd = "MyLoginPassword456"
        
        reg_response = requests.post(f"{BASE_URL}/api/auth/register", json={
            "first_name": "Test",
            "last_name": "LoginUser",
            "company": "TEST_LoginCo",
            "country": "Canada",
            "email": unique_email,
            "phone": "+1-555-0197",
            "password": chosen_pwd
        })
        assert reg_response.status_code == 200, f"Registration failed: {reg_response.text}"
        
        # Now login with the chosen password
        login_response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": unique_email,
            "password": chosen_pwd
        })
        assert login_response.status_code == 200, f"Login failed: {login_response.text}"
        
        login_data = login_response.json()
        assert "token" in login_data
        assert login_data["user"]["email"] == unique_email.lower()
        print(f"✅ Login with user-chosen password works correctly")

    def test_login_with_wrong_password_fails(self):
        """Login should fail with wrong password"""
        # First register
        unique_email = f"test_wrongpwd_{os.urandom(4).hex()}@example.com"
        
        requests.post(f"{BASE_URL}/api/auth/register", json={
            "first_name": "Test",
            "last_name": "WrongPwdUser",
            "company": "TEST_WrongPwdCo",
            "country": "Canada",
            "email": unique_email,
            "phone": "+1-555-0196",
            "password": "CorrectPassword123"
        })
        
        # Try login with wrong password
        login_response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": unique_email,
            "password": "WrongPassword999"
        })
        assert login_response.status_code == 401, f"Should fail with wrong password. Got: {login_response.status_code}"
        print(f"✅ Login correctly rejects wrong password")


# ===== COA/HC/CRA PDF UPLOAD TESTS =====
class TestDocumentUploads:
    """Test COA, Health Canada License, and CRA License PDF uploads on grower form"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Create a sample PDF content for testing"""
        # Simple PDF-like content for testing
        self.pdf_content = b"%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj 2 0 obj<</Type/Pages/Count 1/Kids[3 0 R]>>endobj 3 0 obj<</Type/Page/MediaBox[0 0 612 792]/Parent 2 0 R>>endobj xref 0 4 0000000000 65535 f\n0000000009 00000 n\n0000000052 00000 n\n0000000101 00000 n\ntrailer<</Size 4/Root 1 0 R>>startxref 170 %%EOF"
    
    def test_grower_submit_with_coa_file(self):
        """POST /api/grower/submit accepts coa_file PDF upload"""
        files = {
            'coa_file': ('test_coa.pdf', io.BytesIO(self.pdf_content), 'application/pdf')
        }
        data = {
            'grower_name': 'Test Grower COA',
            'company_name': f'TEST_COA_Company_{os.urandom(3).hex()}',
            'email': f'coa_test_{os.urandom(4).hex()}@example.com',
            'phone': '+1-555-0100',
            'strain_name': f'TEST_COA_Strain_{os.urandom(3).hex()}',
            'strain_type': 'Balanced Hybrid',
            'thc_percentage': '28%',
            'terpene_profile': 'Limonene, Myrcene',
            'lineage': 'Test x Test',
            'lot_size_kg': '35',
            'effects': 'Test effects',
            'export_country': 'Canada',
            'is_irradiated': 'No',
            'willing_to_irradiate': 'Yes'
        }
        
        response = requests.post(f"{BASE_URL}/api/grower/submit", data=data, files=files)
        assert response.status_code == 200, f"Submit with COA failed: {response.text}"
        result = response.json()
        assert "submission_id" in result
        print(f"✅ Grower submission with COA PDF upload works. ID: {result['submission_id']}")
        return result['submission_id']

    def test_grower_submit_with_health_canada_license(self):
        """POST /api/grower/submit accepts health_canada_license PDF upload"""
        files = {
            'health_canada_license': ('hc_license.pdf', io.BytesIO(self.pdf_content), 'application/pdf')
        }
        data = {
            'grower_name': 'Test Grower HC',
            'company_name': f'TEST_HC_Company_{os.urandom(3).hex()}',
            'email': f'hc_test_{os.urandom(4).hex()}@example.com',
            'phone': '+1-555-0101',
            'strain_name': f'TEST_HC_Strain_{os.urandom(3).hex()}',
            'strain_type': 'Indica Dominant',
            'thc_percentage': '30%',
            'terpene_profile': 'Caryophyllene, Linalool',
            'lineage': 'Kush x OG',
            'lot_size_kg': '40',
            'effects': 'Relaxing',
            'export_country': 'Germany',
            'is_irradiated': 'Yes',
            'willing_to_irradiate': 'Yes'
        }
        
        response = requests.post(f"{BASE_URL}/api/grower/submit", data=data, files=files)
        assert response.status_code == 200, f"Submit with HC license failed: {response.text}"
        result = response.json()
        assert "submission_id" in result
        print(f"✅ Grower submission with Health Canada License PDF works. ID: {result['submission_id']}")
        return result['submission_id']

    def test_grower_submit_with_cra_license(self):
        """POST /api/grower/submit accepts cra_license PDF upload"""
        files = {
            'cra_license': ('cra_license.pdf', io.BytesIO(self.pdf_content), 'application/pdf')
        }
        data = {
            'grower_name': 'Test Grower CRA',
            'company_name': f'TEST_CRA_Company_{os.urandom(3).hex()}',
            'email': f'cra_test_{os.urandom(4).hex()}@example.com',
            'phone': '+1-555-0102',
            'strain_name': f'TEST_CRA_Strain_{os.urandom(3).hex()}',
            'strain_type': 'Sativa Dominant',
            'thc_percentage': '26%',
            'terpene_profile': 'Terpinolene, Pinene',
            'lineage': 'Haze x Durban',
            'lot_size_kg': '50',
            'effects': 'Energizing',
            'export_country': 'Australia',
            'is_irradiated': 'No',
            'willing_to_irradiate': 'No'
        }
        
        response = requests.post(f"{BASE_URL}/api/grower/submit", data=data, files=files)
        assert response.status_code == 200, f"Submit with CRA license failed: {response.text}"
        result = response.json()
        assert "submission_id" in result
        print(f"✅ Grower submission with CRA License PDF works. ID: {result['submission_id']}")
        return result['submission_id']

    def test_grower_submit_with_all_documents(self):
        """POST /api/grower/submit accepts all three document uploads"""
        files = {
            'coa_file': ('full_coa.pdf', io.BytesIO(self.pdf_content), 'application/pdf'),
            'health_canada_license': ('full_hc.pdf', io.BytesIO(self.pdf_content), 'application/pdf'),
            'cra_license': ('full_cra.pdf', io.BytesIO(self.pdf_content), 'application/pdf')
        }
        data = {
            'grower_name': 'Test Grower Full',
            'company_name': f'TEST_Full_Company_{os.urandom(3).hex()}',
            'email': f'full_test_{os.urandom(4).hex()}@example.com',
            'phone': '+1-555-0103',
            'strain_name': f'TEST_Full_Strain_{os.urandom(3).hex()}',
            'strain_type': 'Balanced Hybrid',
            'thc_percentage': '32%',
            'terpene_profile': 'All terpenes',
            'lineage': 'Multiple x Genetics',
            'lot_size_kg': '100',
            'effects': 'Full spectrum',
            'export_country': 'Netherlands',
            'is_irradiated': 'Yes',
            'willing_to_irradiate': 'Yes'
        }
        
        response = requests.post(f"{BASE_URL}/api/grower/submit", data=data, files=files)
        assert response.status_code == 200, f"Submit with all docs failed: {response.text}"
        result = response.json()
        assert "submission_id" in result
        print(f"✅ Grower submission with ALL document PDFs works. ID: {result['submission_id']}")
        return result['submission_id']

    def test_grower_submit_without_documents(self):
        """POST /api/grower/submit works without any document uploads (optional)"""
        data = {
            'grower_name': 'Test Grower NoDocs',
            'company_name': f'TEST_NoDocs_Company_{os.urandom(3).hex()}',
            'email': f'nodocs_test_{os.urandom(4).hex()}@example.com',
            'phone': '+1-555-0104',
            'strain_name': f'TEST_NoDocs_Strain_{os.urandom(3).hex()}',
            'strain_type': 'Hybrid, Indica Leaning',
            'thc_percentage': '29%',
            'terpene_profile': 'Basic',
            'lineage': 'Simple x Simple',
            'lot_size_kg': '45',
            'effects': 'Standard',
            'export_country': 'Canada',
            'is_irradiated': 'No',
            'willing_to_irradiate': 'Yes'
        }
        
        response = requests.post(f"{BASE_URL}/api/grower/submit", data=data)
        assert response.status_code == 200, f"Submit without docs failed: {response.text}"
        result = response.json()
        assert "submission_id" in result
        print(f"✅ Grower submission without documents works (optional). ID: {result['submission_id']}")


# ===== ADMIN DOCUMENT LINKS TESTS =====
class TestAdminDocumentLinks:
    """Test admin submissions tab shows document links"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Get admin token"""
        login_response = requests.post(f"{BASE_URL}/api/admin/login", json={
            "password": ADMIN_PASSWORD
        })
        assert login_response.status_code == 200, f"Admin login failed: {login_response.text}"
        self.admin_token = login_response.json()["token"]
        
        # Create a submission with all documents for testing
        self.pdf_content = b"%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj 2 0 obj<</Type/Pages/Count 1/Kids[3 0 R]>>endobj 3 0 obj<</Type/Page/MediaBox[0 0 612 792]/Parent 2 0 R>>endobj xref 0 4 0000000000 65535 f\n0000000009 00000 n\n0000000052 00000 n\n0000000101 00000 n\ntrailer<</Size 4/Root 1 0 R>>startxref 170 %%EOF"
        
    def test_admin_sees_document_paths_in_submissions(self):
        """Admin GET /api/grower/submissions returns document paths"""
        # First create a submission with documents
        files = {
            'coa_file': ('admin_coa.pdf', io.BytesIO(self.pdf_content), 'application/pdf'),
            'health_canada_license': ('admin_hc.pdf', io.BytesIO(self.pdf_content), 'application/pdf'),
            'cra_license': ('admin_cra.pdf', io.BytesIO(self.pdf_content), 'application/pdf')
        }
        data = {
            'grower_name': 'Admin Test Grower',
            'company_name': f'TEST_Admin_Docs_{os.urandom(3).hex()}',
            'email': f'admin_docs_{os.urandom(4).hex()}@example.com',
            'phone': '+1-555-0105',
            'strain_name': f'TEST_Admin_Docs_Strain_{os.urandom(3).hex()}',
            'strain_type': 'Balanced Hybrid',
            'thc_percentage': '31%',
            'terpene_profile': 'Admin test',
            'lineage': 'Admin x Test',
            'lot_size_kg': '60',
            'effects': 'Admin effects',
            'export_country': 'Switzerland',
            'is_irradiated': 'Yes',
            'willing_to_irradiate': 'Yes'
        }
        
        submit_response = requests.post(f"{BASE_URL}/api/grower/submit", data=data, files=files)
        assert submit_response.status_code == 200, f"Submission failed: {submit_response.text}"
        submission_id = submit_response.json()['submission_id']
        
        # Now check admin can see the document paths
        admin_response = requests.get(
            f"{BASE_URL}/api/grower/submissions",
            headers={"Authorization": f"Bearer {self.admin_token}"}
        )
        assert admin_response.status_code == 200, f"Admin fetch failed: {admin_response.text}"
        
        submissions = admin_response.json()
        # Find our submission
        our_sub = next((s for s in submissions if s['id'] == submission_id), None)
        assert our_sub is not None, f"Submission {submission_id} not found in admin list"
        
        # Verify document paths exist
        assert 'coa_path' in our_sub, "coa_path field missing"
        assert 'health_canada_license_path' in our_sub, "health_canada_license_path field missing"
        assert 'cra_license_path' in our_sub, "cra_license_path field missing"
        
        # Verify paths are set (not null) since we uploaded docs
        assert our_sub['coa_path'] is not None, "COA path should not be null"
        assert our_sub['health_canada_license_path'] is not None, "HC license path should not be null"
        assert our_sub['cra_license_path'] is not None, "CRA license path should not be null"
        
        # Verify paths start with /uploads/
        assert our_sub['coa_path'].startswith('/uploads/'), f"COA path format wrong: {our_sub['coa_path']}"
        assert our_sub['health_canada_license_path'].startswith('/uploads/'), f"HC path format wrong: {our_sub['health_canada_license_path']}"
        assert our_sub['cra_license_path'].startswith('/uploads/'), f"CRA path format wrong: {our_sub['cra_license_path']}"
        
        print(f"✅ Admin sees document paths in submissions:")
        print(f"   COA: {our_sub['coa_path']}")
        print(f"   HC License: {our_sub['health_canada_license_path']}")
        print(f"   CRA License: {our_sub['cra_license_path']}")

    def test_uploaded_documents_accessible(self):
        """Uploaded document PDFs are accessible via static URL"""
        # Create submission with doc
        files = {
            'coa_file': ('accessible_coa.pdf', io.BytesIO(self.pdf_content), 'application/pdf')
        }
        data = {
            'grower_name': 'Accessible Test',
            'company_name': f'TEST_Accessible_{os.urandom(3).hex()}',
            'email': f'accessible_{os.urandom(4).hex()}@example.com',
            'phone': '+1-555-0106',
            'strain_name': f'TEST_Accessible_Strain_{os.urandom(3).hex()}',
            'strain_type': 'Indica Dominant',
            'thc_percentage': '27%',
            'terpene_profile': 'Access test',
            'lineage': 'Access x Test',
            'lot_size_kg': '35',
            'effects': 'Access effects',
            'export_country': 'Canada',
            'is_irradiated': 'No',
            'willing_to_irradiate': 'Yes'
        }
        
        submit_response = requests.post(f"{BASE_URL}/api/grower/submit", data=data, files=files)
        assert submit_response.status_code == 200
        submission_id = submit_response.json()['submission_id']
        
        # Get submission to find COA path
        admin_response = requests.get(
            f"{BASE_URL}/api/grower/submissions",
            headers={"Authorization": f"Bearer {self.admin_token}"}
        )
        submissions = admin_response.json()
        our_sub = next((s for s in submissions if s['id'] == submission_id), None)
        
        # Try to access the COA file
        coa_url = f"{BASE_URL}{our_sub['coa_path']}"
        coa_response = requests.get(coa_url)
        assert coa_response.status_code == 200, f"COA file not accessible at {coa_url}: {coa_response.status_code}"
        assert b'%PDF' in coa_response.content, "COA file content doesn't look like PDF"
        print(f"✅ Uploaded document accessible at {coa_url}")


# ===== PREVIOUS FEATURES STILL WORK =====
class TestPreviousFeaturesStillWork:
    """Ensure 30kg min lot, export country, irradiation, image upload still work"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        self.pdf_content = b"%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj 2 0 obj<</Type/Pages/Count 1/Kids[3 0 R]>>endobj 3 0 obj<</Type/Page/MediaBox[0 0 612 792]/Parent 2 0 R>>endobj xref 0 4 0000000000 65535 f\n0000000009 00000 n\n0000000052 00000 n\n0000000101 00000 n\ntrailer<</Size 4/Root 1 0 R>>startxref 170 %%EOF"
        
    def test_30kg_minimum_still_enforced(self):
        """Lot size under 30kg should still be rejected"""
        data = {
            'grower_name': 'Test Min Lot',
            'company_name': f'TEST_MinLot_{os.urandom(3).hex()}',
            'email': f'minlot_{os.urandom(4).hex()}@example.com',
            'phone': '+1-555-0110',
            'strain_name': f'TEST_MinLot_Strain_{os.urandom(3).hex()}',
            'strain_type': 'Balanced Hybrid',
            'thc_percentage': '28%',
            'terpene_profile': 'Min test',
            'lineage': 'Min x Test',
            'lot_size_kg': '25',  # Under 30kg
            'effects': 'Min effects',
            'export_country': 'Canada',
            'is_irradiated': 'No',
            'willing_to_irradiate': 'Yes'
        }
        
        response = requests.post(f"{BASE_URL}/api/grower/submit", data=data)
        assert response.status_code == 400, f"Should reject under 30kg. Got: {response.status_code}"
        assert "30" in response.text.lower() or "minimum" in response.text.lower()
        print(f"✅ 30kg minimum lot size still enforced")

    def test_export_country_stored(self):
        """Export country field should be stored"""
        login_resp = requests.post(f"{BASE_URL}/api/admin/login", json={"password": ADMIN_PASSWORD})
        admin_token = login_resp.json()["token"]
        
        unique_strain = f'TEST_Export_Strain_{os.urandom(3).hex()}'
        data = {
            'grower_name': 'Export Test',
            'company_name': f'TEST_Export_{os.urandom(3).hex()}',
            'email': f'export_{os.urandom(4).hex()}@example.com',
            'phone': '+1-555-0111',
            'strain_name': unique_strain,
            'strain_type': 'Sativa Dominant',
            'thc_percentage': '29%',
            'terpene_profile': 'Export test',
            'lineage': 'Export x Test',
            'lot_size_kg': '40',
            'effects': 'Export effects',
            'export_country': 'Italy',
            'is_irradiated': 'Yes',
            'willing_to_irradiate': 'Yes'
        }
        
        submit_resp = requests.post(f"{BASE_URL}/api/grower/submit", data=data)
        assert submit_resp.status_code == 200
        sub_id = submit_resp.json()['submission_id']
        
        # Verify in admin
        admin_resp = requests.get(f"{BASE_URL}/api/grower/submissions", headers={"Authorization": f"Bearer {admin_token}"})
        subs = admin_resp.json()
        our_sub = next((s for s in subs if s['id'] == sub_id), None)
        
        assert our_sub['export_country'] == 'Italy', f"Export country not stored: {our_sub.get('export_country')}"
        print(f"✅ Export country field still works")

    def test_irradiation_fields_stored(self):
        """Irradiation fields should be stored"""
        login_resp = requests.post(f"{BASE_URL}/api/admin/login", json={"password": ADMIN_PASSWORD})
        admin_token = login_resp.json()["token"]
        
        unique_strain = f'TEST_Irrad_Strain_{os.urandom(3).hex()}'
        data = {
            'grower_name': 'Irrad Test',
            'company_name': f'TEST_Irrad_{os.urandom(3).hex()}',
            'email': f'irrad_{os.urandom(4).hex()}@example.com',
            'phone': '+1-555-0112',
            'strain_name': unique_strain,
            'strain_type': 'Indica Dominant',
            'thc_percentage': '30%',
            'terpene_profile': 'Irrad test',
            'lineage': 'Irrad x Test',
            'lot_size_kg': '55',
            'effects': 'Irrad effects',
            'export_country': 'UK',
            'is_irradiated': 'No',
            'willing_to_irradiate': 'Yes'
        }
        
        submit_resp = requests.post(f"{BASE_URL}/api/grower/submit", data=data)
        assert submit_resp.status_code == 200
        sub_id = submit_resp.json()['submission_id']
        
        # Verify in admin
        admin_resp = requests.get(f"{BASE_URL}/api/grower/submissions", headers={"Authorization": f"Bearer {admin_token}"})
        subs = admin_resp.json()
        our_sub = next((s for s in subs if s['id'] == sub_id), None)
        
        assert our_sub['is_irradiated'] == 'No', f"is_irradiated not stored: {our_sub.get('is_irradiated')}"
        assert our_sub['willing_to_irradiate'] == 'Yes', f"willing_to_irradiate not stored: {our_sub.get('willing_to_irradiate')}"
        print(f"✅ Irradiation fields still work")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
