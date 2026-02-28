"""
Test CSV Export and COA Redaction Features
==========================================
Tests for:
1. GET /api/admin/strain-directory/csv - CSV export with all submission details
2. PUT /api/admin/submissions/{submission_id}/redacted-coa - Upload redacted COA

Test Coverage:
- CSV export endpoint requires admin auth
- CSV contains all required columns
- COA redaction endpoint requires admin auth
- COA redaction updates submission properly
"""

import pytest
import requests
import os
import io
import csv

# Get backend URL from environment
BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')
ADMIN_PASSWORD = "firegold2026"

@pytest.fixture(scope="module")
def admin_token():
    """Login as admin and get token"""
    response = requests.post(f"{BASE_URL}/api/admin/login", json={"password": ADMIN_PASSWORD})
    assert response.status_code == 200, f"Admin login failed: {response.text}"
    return response.json()['token']

@pytest.fixture(scope="module")
def test_submission_with_coa(admin_token):
    """Find or create a test submission with COA for redaction testing"""
    # First check existing submissions
    response = requests.get(f"{BASE_URL}/api/grower/submissions", 
                           headers={"Authorization": f"Bearer {admin_token}"})
    assert response.status_code == 200
    submissions = response.json()
    
    # Find a pending submission with COA that we can test with
    for sub in submissions:
        if sub.get('coa_path') and sub.get('status') == 'pending':
            return sub
    
    # If no pending submission with COA, create one
    # First create a dummy PDF
    pdf_content = b"%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj\n3 0 obj<</Type/Page/MediaBox[0 0 612 792]/Parent 2 0 R>>endobj\nxref\n0 4\n0000000000 65535 f\n0000000009 00000 n\n0000000058 00000 n\n0000000115 00000 n\ntrailer<</Size 4/Root 1 0 R>>\nstartxref\n190\n%%EOF"
    
    files = {
        'grower_name': (None, 'Test Grower CSV'),
        'company_name': (None, 'TEST_CSV_LP'),
        'email': (None, 'test_csv@example.com'),
        'phone': (None, '+1-555-CSV-TEST'),
        'strain_name': (None, f'TEST_CSV_Strain_{os.urandom(4).hex()}'),
        'strain_type': (None, 'Balanced Hybrid'),
        'thc_percentage': (None, '28%'),
        'terpene_profile': (None, 'Limonene, Caryophyllene'),
        'lineage': (None, 'OG Kush x Blue Dream'),
        'lot_size_kg': (None, '35'),
        'effects': (None, 'Relaxation, Mood Elevation'),
        'export_country': (None, 'Canada'),
        'is_irradiated': (None, 'No'),
        'willing_to_irradiate': (None, 'Yes'),
        'coa_file': ('test_coa.pdf', io.BytesIO(pdf_content), 'application/pdf')
    }
    
    response = requests.post(f"{BASE_URL}/api/grower/submit", files=files)
    if response.status_code == 201 or response.status_code == 200:
        sub_id = response.json().get('submission_id')
        # Fetch the new submission
        response = requests.get(f"{BASE_URL}/api/grower/submissions", 
                               headers={"Authorization": f"Bearer {admin_token}"})
        for sub in response.json():
            if sub.get('id') == sub_id:
                return sub
    
    # Return any submission with COA even if not pending
    for sub in submissions:
        if sub.get('coa_path'):
            return sub
    
    pytest.skip("No submission with COA available for testing")


class TestCSVExportEndpoint:
    """Tests for GET /api/admin/strain-directory/csv"""
    
    def test_csv_export_requires_auth(self):
        """CSV export endpoint should return 401 without token"""
        response = requests.get(f"{BASE_URL}/api/admin/strain-directory/csv")
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("✅ CSV export returns 401 without auth")
    
    def test_csv_export_rejects_invalid_token(self):
        """CSV export endpoint should return 401 with invalid token"""
        response = requests.get(f"{BASE_URL}/api/admin/strain-directory/csv",
                               headers={"Authorization": "Bearer invalid_token_xyz"})
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("✅ CSV export returns 401 with invalid token")
    
    def test_csv_export_success(self, admin_token):
        """CSV export should return valid CSV with admin token"""
        response = requests.get(f"{BASE_URL}/api/admin/strain-directory/csv",
                               headers={"Authorization": f"Bearer {admin_token}"})
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        assert 'text/csv' in response.headers.get('Content-Type', ''), \
            f"Expected text/csv content type, got {response.headers.get('Content-Type')}"
        print("✅ CSV export returns 200 with valid admin token")
    
    def test_csv_has_correct_headers(self, admin_token):
        """CSV should have all required column headers"""
        response = requests.get(f"{BASE_URL}/api/admin/strain-directory/csv",
                               headers={"Authorization": f"Bearer {admin_token}"})
        assert response.status_code == 200
        
        # Parse CSV
        csv_content = response.text
        reader = csv.reader(io.StringIO(csv_content))
        headers = next(reader)
        
        # Expected columns from the requirements
        expected_columns = [
            "Strain Name", "Type", "THC %", "CBD %", "Lot Size", "Effects", "Lineage",
            "Terpene Profile", "Price Tier",
            "Grower/LP Name", "Company", "Email", "Phone", "License Number",
            "Submission Date", "Submission Status", "Growing Method",
            "Export Country", "Irradiated", "Willing to Irradiate",
            "Admin Price/Gram", "Admin Notes", "Additional Notes",
            "Has COA", "Has HC License", "Has CRA License"
        ]
        
        for col in expected_columns:
            assert col in headers, f"Missing column '{col}' in CSV headers. Found: {headers}"
        
        print(f"✅ CSV has all {len(expected_columns)} required columns")
        print(f"   Columns: {headers}")
    
    def test_csv_has_data_rows(self, admin_token):
        """CSV should contain strain data"""
        response = requests.get(f"{BASE_URL}/api/admin/strain-directory/csv",
                               headers={"Authorization": f"Bearer {admin_token}"})
        assert response.status_code == 200
        
        csv_content = response.text
        reader = csv.reader(io.StringIO(csv_content))
        rows = list(reader)
        
        # Should have header row + at least one data row
        assert len(rows) > 1, "CSV should contain data rows, not just headers"
        
        # Count data rows
        data_row_count = len(rows) - 1  # Exclude header
        print(f"✅ CSV contains {data_row_count} data rows")
        
        # Verify first data row has strain name
        if data_row_count > 0:
            first_data_row = rows[1]
            strain_name = first_data_row[0]  # First column is Strain Name
            assert strain_name, "Strain Name should not be empty"
            print(f"   First strain: {strain_name}")
    
    def test_csv_download_header(self, admin_token):
        """CSV response should have proper download filename header"""
        response = requests.get(f"{BASE_URL}/api/admin/strain-directory/csv",
                               headers={"Authorization": f"Bearer {admin_token}"})
        assert response.status_code == 200
        
        content_disposition = response.headers.get('Content-Disposition', '')
        assert 'attachment' in content_disposition, \
            f"Expected attachment in Content-Disposition, got: {content_disposition}"
        assert 'firegold_strain_directory' in content_disposition, \
            f"Expected filename with firegold_strain_directory, got: {content_disposition}"
        assert '.csv' in content_disposition, \
            f"Expected .csv extension, got: {content_disposition}"
        
        print(f"✅ CSV has correct download header: {content_disposition}")


class TestCOARedactionEndpoint:
    """Tests for PUT /api/admin/submissions/{submission_id}/redacted-coa"""
    
    def test_redacted_coa_requires_auth(self, test_submission_with_coa):
        """Redacted COA endpoint should return 401 without token"""
        if not test_submission_with_coa:
            pytest.skip("No test submission available")
        
        sub_id = test_submission_with_coa['id']
        pdf_content = b"%PDF-1.4\ntest"
        files = {'coa': ('redacted.pdf', io.BytesIO(pdf_content), 'application/pdf')}
        
        response = requests.put(f"{BASE_URL}/api/admin/submissions/{sub_id}/redacted-coa",
                               files=files)
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("✅ Redacted COA endpoint returns 401 without auth")
    
    def test_redacted_coa_rejects_invalid_token(self, test_submission_with_coa):
        """Redacted COA endpoint should return 401 with invalid token"""
        if not test_submission_with_coa:
            pytest.skip("No test submission available")
        
        sub_id = test_submission_with_coa['id']
        pdf_content = b"%PDF-1.4\ntest"
        files = {'coa': ('redacted.pdf', io.BytesIO(pdf_content), 'application/pdf')}
        
        response = requests.put(f"{BASE_URL}/api/admin/submissions/{sub_id}/redacted-coa",
                               files=files,
                               headers={"Authorization": "Bearer invalid_token"})
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("✅ Redacted COA endpoint returns 401 with invalid token")
    
    def test_redacted_coa_rejects_non_pdf(self, admin_token, test_submission_with_coa):
        """Redacted COA endpoint should reject non-PDF files"""
        if not test_submission_with_coa:
            pytest.skip("No test submission available")
        
        sub_id = test_submission_with_coa['id']
        files = {'coa': ('redacted.txt', io.BytesIO(b"not a pdf"), 'text/plain')}
        
        response = requests.put(f"{BASE_URL}/api/admin/submissions/{sub_id}/redacted-coa",
                               files=files,
                               headers={"Authorization": f"Bearer {admin_token}"})
        assert response.status_code == 400, f"Expected 400 for non-PDF, got {response.status_code}"
        print("✅ Redacted COA endpoint rejects non-PDF files")
    
    def test_redacted_coa_not_found_submission(self, admin_token):
        """Redacted COA endpoint should return 404 for non-existent submission"""
        fake_id = "non-existent-id-xyz"
        pdf_content = b"%PDF-1.4\ntest"
        files = {'coa': ('redacted.pdf', io.BytesIO(pdf_content), 'application/pdf')}
        
        response = requests.put(f"{BASE_URL}/api/admin/submissions/{fake_id}/redacted-coa",
                               files=files,
                               headers={"Authorization": f"Bearer {admin_token}"})
        assert response.status_code == 404, f"Expected 404 for non-existent submission, got {response.status_code}"
        print("✅ Redacted COA endpoint returns 404 for non-existent submission")
    
    def test_redacted_coa_upload_success(self, admin_token, test_submission_with_coa):
        """Redacted COA should upload successfully and update submission"""
        if not test_submission_with_coa:
            pytest.skip("No test submission available")
        
        sub_id = test_submission_with_coa['id']
        
        # Create a valid PDF-like content
        pdf_content = b"%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj\n3 0 obj<</Type/Page/MediaBox[0 0 612 792]/Parent 2 0 R>>endobj\nxref\n0 4\n0000000000 65535 f\n0000000009 00000 n\n0000000058 00000 n\n0000000115 00000 n\ntrailer<</Size 4/Root 1 0 R>>\nstartxref\n190\n%%EOF"
        files = {'coa': ('redacted_coa.pdf', io.BytesIO(pdf_content), 'application/pdf')}
        
        response = requests.put(f"{BASE_URL}/api/admin/submissions/{sub_id}/redacted-coa",
                               files=files,
                               headers={"Authorization": f"Bearer {admin_token}"})
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert 'coa_path' in data, "Response should contain coa_path"
        assert data['coa_path'].endswith('.pdf'), "coa_path should be a PDF"
        print(f"✅ Redacted COA uploaded successfully: {data['coa_path']}")
    
    def test_redacted_coa_updates_flag(self, admin_token, test_submission_with_coa):
        """After uploading redacted COA, coa_redacted should be True"""
        if not test_submission_with_coa:
            pytest.skip("No test submission available")
        
        sub_id = test_submission_with_coa['id']
        
        # Verify the submission now has coa_redacted=True
        response = requests.get(f"{BASE_URL}/api/grower/submissions",
                               headers={"Authorization": f"Bearer {admin_token}"})
        assert response.status_code == 200
        
        submissions = response.json()
        updated_sub = next((s for s in submissions if s['id'] == sub_id), None)
        
        assert updated_sub is not None, f"Could not find submission {sub_id}"
        assert updated_sub.get('coa_redacted') == True, \
            f"coa_redacted should be True, got: {updated_sub.get('coa_redacted')}"
        print("✅ Submission coa_redacted flag is True after upload")


class TestCSVContentValidation:
    """Additional tests for CSV content validation"""
    
    def test_csv_has_coa_status_columns(self, admin_token):
        """CSV should have COA, HC License, CRA License status columns with Yes/No values"""
        response = requests.get(f"{BASE_URL}/api/admin/strain-directory/csv",
                               headers={"Authorization": f"Bearer {admin_token}"})
        assert response.status_code == 200
        
        csv_content = response.text
        reader = csv.DictReader(io.StringIO(csv_content))
        rows = list(reader)
        
        if len(rows) > 0:
            first_row = rows[0]
            
            # Check COA status column
            coa_status = first_row.get('Has COA', '')
            assert coa_status in ['Yes', 'No', ''], f"Has COA should be Yes/No, got: {coa_status}"
            
            # Check HC License status
            hc_status = first_row.get('Has HC License', '')
            assert hc_status in ['Yes', 'No', ''], f"Has HC License should be Yes/No, got: {hc_status}"
            
            # Check CRA License status
            cra_status = first_row.get('Has CRA License', '')
            assert cra_status in ['Yes', 'No', ''], f"Has CRA License should be Yes/No, got: {cra_status}"
            
            print(f"✅ CSV has valid document status values")
            print(f"   Sample row - COA: {coa_status}, HC: {hc_status}, CRA: {cra_status}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
