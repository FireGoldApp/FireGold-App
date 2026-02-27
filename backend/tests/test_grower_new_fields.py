"""
Test suite for NEW Grower Submission fields - Export Country, Irradiation, Image Upload
Tests: POST /api/grower/submit with multipart/form-data
Tests admin submissions view with new fields
"""
import pytest
import requests
import os
import uuid
import io

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')
ADMIN_PASSWORD = "firegold2026"

class TestGrowerNewFields:
    """Tests for new grower submission fields: export_country, is_irradiated, willing_to_irradiate, image upload"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup for each test"""
        self.test_id = str(uuid.uuid4())[:8]
    
    def get_admin_token(self):
        """Get admin authentication token"""
        response = requests.post(f"{BASE_URL}/api/admin/login", json={"password": ADMIN_PASSWORD})
        assert response.status_code == 200, f"Admin login failed: {response.text}"
        return response.json()["token"]
    
    # =====================
    # POST /api/grower/submit with multipart/form-data
    # =====================
    
    def test_submit_with_export_country(self):
        """Test submission with export_country field using multipart/form-data"""
        form_data = {
            'grower_name': f'TEST_Grower_{self.test_id}',
            'company_name': f'TEST_ExportCompany_{self.test_id}',
            'email': f'test_export_{self.test_id}@example.com',
            'phone': '+1 555-111-0001',
            'strain_name': f'TEST_ExportStrain_{self.test_id}',
            'strain_type': 'Balanced Hybrid',
            'thc_percentage': '28%',
            'terpene_profile': 'Limonene, Caryophyllene',
            'lineage': 'OG Kush x Blue Dream',
            'lot_size_kg': '50',
            'effects': 'Relaxation, Mood Elevation',
            'export_country': 'Germany'  # NEW field
        }
        
        response = requests.post(f"{BASE_URL}/api/grower/submit", data=form_data)
        
        # Status assertion
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        # Data assertions
        data = response.json()
        assert "submission_id" in data
        
        # Verify the submission has export_country stored
        token = self.get_admin_token()
        sub_response = requests.get(
            f"{BASE_URL}/api/grower/submissions",
            headers={"Authorization": f"Bearer {token}"}
        )
        submissions = sub_response.json()
        our_sub = next((s for s in submissions if s['id'] == data['submission_id']), None)
        
        assert our_sub is not None, "Submission should be found"
        assert our_sub.get('export_country') == 'Germany', f"Export country should be Germany, got {our_sub.get('export_country')}"
        
        print(f"✅ Submission with export_country=Germany successful: ID={data['submission_id']}")
        return data['submission_id']
    
    def test_submit_with_irradiation_yes_yes(self):
        """Test submission with is_irradiated=Yes and willing_to_irradiate=Yes"""
        form_data = {
            'grower_name': f'TEST_Grower_{self.test_id}',
            'company_name': f'TEST_IrradiatedCompany_{self.test_id}',
            'email': f'test_irrad_{self.test_id}@example.com',
            'phone': '+1 555-111-0002',
            'strain_name': f'TEST_IrradiatedStrain_{self.test_id}',
            'strain_type': 'Indica Dominant',
            'thc_percentage': '30%',
            'terpene_profile': 'Myrcene, Linalool',
            'lineage': 'Northern Lights x Skunk',
            'lot_size_kg': '45',
            'effects': 'Relaxation, Sleep',
            'export_country': 'Canada',
            'is_irradiated': 'Yes',  # NEW field
            'willing_to_irradiate': 'Yes'  # NEW field
        }
        
        response = requests.post(f"{BASE_URL}/api/grower/submit", data=form_data)
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        
        # Verify irradiation fields stored correctly
        token = self.get_admin_token()
        sub_response = requests.get(
            f"{BASE_URL}/api/grower/submissions",
            headers={"Authorization": f"Bearer {token}"}
        )
        submissions = sub_response.json()
        our_sub = next((s for s in submissions if s['id'] == data['submission_id']), None)
        
        assert our_sub is not None
        assert our_sub.get('is_irradiated') == 'Yes', f"is_irradiated should be Yes, got {our_sub.get('is_irradiated')}"
        assert our_sub.get('willing_to_irradiate') == 'Yes', f"willing_to_irradiate should be Yes, got {our_sub.get('willing_to_irradiate')}"
        
        print(f"✅ Submission with is_irradiated=Yes, willing_to_irradiate=Yes successful")
    
    def test_submit_with_irradiation_no_no(self):
        """Test submission with is_irradiated=No and willing_to_irradiate=No"""
        form_data = {
            'grower_name': f'TEST_Grower_{self.test_id}',
            'company_name': f'TEST_NotIrradiatedCompany_{self.test_id}',
            'email': f'test_noirrad_{self.test_id}@example.com',
            'phone': '+1 555-111-0003',
            'strain_name': f'TEST_NotIrradiatedStrain_{self.test_id}',
            'strain_type': 'Sativa Dominant',
            'thc_percentage': '26%',
            'terpene_profile': 'Terpinolene, Limonene',
            'lineage': 'Durban Poison',
            'lot_size_kg': '35',
            'effects': 'Energy, Focus',
            'export_country': 'Australia',
            'is_irradiated': 'No',  # NEW field
            'willing_to_irradiate': 'No'  # NEW field
        }
        
        response = requests.post(f"{BASE_URL}/api/grower/submit", data=form_data)
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        
        # Verify irradiation fields stored correctly
        token = self.get_admin_token()
        sub_response = requests.get(
            f"{BASE_URL}/api/grower/submissions",
            headers={"Authorization": f"Bearer {token}"}
        )
        submissions = sub_response.json()
        our_sub = next((s for s in submissions if s['id'] == data['submission_id']), None)
        
        assert our_sub is not None
        assert our_sub.get('is_irradiated') == 'No', f"is_irradiated should be No, got {our_sub.get('is_irradiated')}"
        assert our_sub.get('willing_to_irradiate') == 'No', f"willing_to_irradiate should be No, got {our_sub.get('willing_to_irradiate')}"
        
        print(f"✅ Submission with is_irradiated=No, willing_to_irradiate=No successful")
    
    def test_submit_with_image_upload(self):
        """Test submission with image file upload (JPG/PNG/WebP)"""
        # Create a minimal valid PNG image (1x1 pixel red)
        png_bytes = bytes([
            0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A,  # PNG signature
            0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52,  # IHDR chunk start
            0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,  # width=1, height=1
            0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53,  # bit depth, color type, etc
            0xDE, 0x00, 0x00, 0x00, 0x0C, 0x49, 0x44, 0x41,  # IDAT chunk
            0x54, 0x08, 0xD7, 0x63, 0xF8, 0xCF, 0xC0, 0x00,  # compressed data
            0x00, 0x00, 0x03, 0x00, 0x01, 0x00, 0x05, 0xFE,  
            0xD4, 0xEF, 0x00, 0x00, 0x00, 0x00, 0x49, 0x45,  # IEND chunk
            0x4E, 0x44, 0xAE, 0x42, 0x60, 0x82
        ])
        
        form_data = {
            'grower_name': f'TEST_Grower_{self.test_id}',
            'company_name': f'TEST_ImageCompany_{self.test_id}',
            'email': f'test_image_{self.test_id}@example.com',
            'phone': '+1 555-111-0004',
            'strain_name': f'TEST_ImageStrain_{self.test_id}',
            'strain_type': 'Balanced Hybrid',
            'thc_percentage': '29%',
            'terpene_profile': 'Caryophyllene, Limonene',
            'lineage': 'Wedding Cake x Gelato',
            'lot_size_kg': '40',
            'effects': 'Euphoria, Relaxation',
            'export_country': 'United States',
            'is_irradiated': 'Yes',
            'willing_to_irradiate': 'Yes'
        }
        
        files = {
            'strain_image': (f'test_strain_{self.test_id}.png', io.BytesIO(png_bytes), 'image/png')
        }
        
        response = requests.post(f"{BASE_URL}/api/grower/submit", data=form_data, files=files)
        
        assert response.status_code == 200, f"Expected 200 for image upload, got {response.status_code}: {response.text}"
        data = response.json()
        
        # Verify the submission has image_path stored
        token = self.get_admin_token()
        sub_response = requests.get(
            f"{BASE_URL}/api/grower/submissions",
            headers={"Authorization": f"Bearer {token}"}
        )
        submissions = sub_response.json()
        our_sub = next((s for s in submissions if s['id'] == data['submission_id']), None)
        
        assert our_sub is not None
        assert our_sub.get('image_path') is not None, "image_path should be set"
        assert '/submissions/' in our_sub.get('image_path', ''), f"image_path should contain /submissions/, got {our_sub.get('image_path')}"
        
        print(f"✅ Submission with image upload successful: image_path={our_sub.get('image_path')}")
        return data['submission_id'], our_sub.get('image_path')
    
    def test_submit_without_image_still_works(self):
        """Test that submission without image still works (image is optional)"""
        form_data = {
            'grower_name': f'TEST_Grower_{self.test_id}',
            'company_name': f'TEST_NoImageCompany_{self.test_id}',
            'email': f'test_noimage_{self.test_id}@example.com',
            'phone': '+1 555-111-0005',
            'strain_name': f'TEST_NoImageStrain_{self.test_id}',
            'strain_type': 'Hybrid, Indica Leaning',
            'thc_percentage': '31%',
            'terpene_profile': 'Myrcene, Caryophyllene',
            'lineage': 'GMO x MAC',
            'lot_size_kg': '60',
            'effects': 'Heavy Relaxation',
            'export_country': 'Netherlands',
            'is_irradiated': 'No',
            'willing_to_irradiate': 'Yes'
        }
        
        response = requests.post(f"{BASE_URL}/api/grower/submit", data=form_data)
        
        assert response.status_code == 200, f"Expected 200 without image, got {response.status_code}: {response.text}"
        data = response.json()
        
        # Verify submission exists without image
        token = self.get_admin_token()
        sub_response = requests.get(
            f"{BASE_URL}/api/grower/submissions",
            headers={"Authorization": f"Bearer {token}"}
        )
        submissions = sub_response.json()
        our_sub = next((s for s in submissions if s['id'] == data['submission_id']), None)
        
        assert our_sub is not None
        assert our_sub.get('image_path') is None, f"image_path should be None for submission without image"
        
        print(f"✅ Submission without image works correctly")
    
    def test_submit_with_invalid_image_format(self):
        """Test that invalid image format is rejected (non JPG/PNG/WebP)"""
        # Create a fake file that is not an image
        fake_file = b"This is not an image file"
        
        form_data = {
            'grower_name': f'TEST_Grower_{self.test_id}',
            'company_name': f'TEST_BadImageCompany_{self.test_id}',
            'email': f'test_badimg_{self.test_id}@example.com',
            'phone': '+1 555-111-0006',
            'strain_name': f'TEST_BadImageStrain_{self.test_id}',
            'strain_type': 'Balanced Hybrid',
            'thc_percentage': '27%',
            'terpene_profile': 'Limonene',
            'lineage': 'Unknown',
            'lot_size_kg': '35',
            'effects': 'Uplift',
            'export_country': 'Spain'
        }
        
        files = {
            'strain_image': (f'test_strain_{self.test_id}.txt', io.BytesIO(fake_file), 'text/plain')
        }
        
        response = requests.post(f"{BASE_URL}/api/grower/submit", data=form_data, files=files)
        
        # Should be rejected with 400
        assert response.status_code == 400, f"Expected 400 for invalid image format, got {response.status_code}"
        
        print(f"✅ Invalid image format correctly rejected")
    
    def test_30kg_minimum_still_enforced_with_multipart(self):
        """Test that 30kg minimum lot size is still enforced with multipart/form-data"""
        form_data = {
            'grower_name': f'TEST_Grower_{self.test_id}',
            'company_name': f'TEST_SmallLotCompany_{self.test_id}',
            'email': f'test_smalllot_{self.test_id}@example.com',
            'phone': '+1 555-111-0007',
            'strain_name': f'TEST_SmallLotStrain_{self.test_id}',
            'strain_type': 'Indica Dominant',
            'thc_percentage': '25%',
            'terpene_profile': 'Myrcene',
            'lineage': 'Kush',
            'lot_size_kg': '25',  # Below 30kg minimum
            'effects': 'Relax',
            'export_country': 'France',
            'is_irradiated': 'No',
            'willing_to_irradiate': 'No'
        }
        
        response = requests.post(f"{BASE_URL}/api/grower/submit", data=form_data)
        
        # Should be rejected with 400
        assert response.status_code == 400, f"Expected 400 for <30kg with multipart, got {response.status_code}: {response.text}"
        assert "30" in response.json().get("detail", ""), "Error should mention 30kg minimum"
        
        print(f"✅ 30kg minimum still enforced with multipart/form-data")
    
    def test_admin_approve_with_new_fields_transfers_image(self):
        """Test that approving a submission with image transfers image_url to the strain"""
        # First create a submission with image
        png_bytes = bytes([
            0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A,
            0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52,
            0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
            0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53,
            0xDE, 0x00, 0x00, 0x00, 0x0C, 0x49, 0x44, 0x41,
            0x54, 0x08, 0xD7, 0x63, 0xF8, 0xCF, 0xC0, 0x00,
            0x00, 0x00, 0x03, 0x00, 0x01, 0x00, 0x05, 0xFE,
            0xD4, 0xEF, 0x00, 0x00, 0x00, 0x00, 0x49, 0x45,
            0x4E, 0x44, 0xAE, 0x42, 0x60, 0x82
        ])
        
        form_data = {
            'grower_name': f'TEST_Grower_{self.test_id}',
            'company_name': f'TEST_ApproveImageCompany_{self.test_id}',
            'email': f'test_approveimg_{self.test_id}@example.com',
            'phone': '+1 555-111-0008',
            'strain_name': f'TEST_ApproveImageStrain_{self.test_id}',
            'strain_type': 'Balanced Hybrid',
            'thc_percentage': '32%',
            'terpene_profile': 'Limonene, Caryophyllene, Myrcene',
            'lineage': 'Gelato x Biscotti',
            'lot_size_kg': '55',
            'effects': 'Euphoria, Creative',
            'export_country': 'Italy',
            'is_irradiated': 'Yes',
            'willing_to_irradiate': 'Yes'
        }
        
        files = {
            'strain_image': (f'approved_strain_{self.test_id}.png', io.BytesIO(png_bytes), 'image/png')
        }
        
        response = requests.post(f"{BASE_URL}/api/grower/submit", data=form_data, files=files)
        assert response.status_code == 200
        submission_id = response.json()['submission_id']
        
        # Approve the submission
        token = self.get_admin_token()
        update_body = {
            "status": "approved",
            "admin_notes": "Great flower with image",
            "admin_price_per_gram": "7.50"
        }
        
        approve_response = requests.put(
            f"{BASE_URL}/api/grower/submissions/{submission_id}/status",
            json=update_body,
            headers={"Authorization": f"Bearer {token}"}
        )
        
        assert approve_response.status_code == 200, f"Approve failed: {approve_response.text}"
        
        # Verify strain was added to catalog with image_url from submission
        strains_response = requests.get(
            f"{BASE_URL}/api/strains/admin",
            headers={"Authorization": f"Bearer {token}"}
        )
        strains = strains_response.json()
        approved_strain = next((s for s in strains if s["strain_name"] == form_data['strain_name']), None)
        
        assert approved_strain is not None, "Approved strain should be in catalog"
        assert approved_strain.get('image_url') is not None, "Approved strain should have image_url"
        assert '/submissions/' in approved_strain.get('image_url', ''), f"image_url should come from submission, got {approved_strain.get('image_url')}"
        
        print(f"✅ Admin approve transfers image_url to strain: {approved_strain.get('image_url')}")
    
    def test_all_new_fields_together(self):
        """Test submission with all new fields: export_country, irradiation, and image"""
        png_bytes = bytes([
            0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A,
            0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52,
            0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
            0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53,
            0xDE, 0x00, 0x00, 0x00, 0x0C, 0x49, 0x44, 0x41,
            0x54, 0x08, 0xD7, 0x63, 0xF8, 0xCF, 0xC0, 0x00,
            0x00, 0x00, 0x03, 0x00, 0x01, 0x00, 0x05, 0xFE,
            0xD4, 0xEF, 0x00, 0x00, 0x00, 0x00, 0x49, 0x45,
            0x4E, 0x44, 0xAE, 0x42, 0x60, 0x82
        ])
        
        form_data = {
            'grower_name': f'TEST_FullFields_{self.test_id}',
            'company_name': f'TEST_FullFieldsCompany_{self.test_id}',
            'email': f'test_full_{self.test_id}@example.com',
            'phone': '+1 555-111-0009',
            'license_number': 'LIC-FULL-001',
            'strain_name': f'TEST_FullFieldsStrain_{self.test_id}',
            'strain_type': 'Hybrid, Sativa Leaning',
            'thc_percentage': '33%',
            'cbd_percentage': '0.3%',
            'terpene_profile': 'Terpinolene, Ocimene, Myrcene',
            'lineage': 'Jack Herer x Trainwreck',
            'lot_size_kg': '80',
            'effects': 'Energy, Focus, Creativity',
            'growing_method': 'Greenhouse',
            'export_country': 'Switzerland',  # NEW
            'is_irradiated': 'No',  # NEW
            'willing_to_irradiate': 'Yes',  # NEW
            'additional_notes': 'Full test with all new fields'
        }
        
        files = {
            'strain_image': (f'full_fields_{self.test_id}.png', io.BytesIO(png_bytes), 'image/png')
        }
        
        response = requests.post(f"{BASE_URL}/api/grower/submit", data=form_data, files=files)
        
        assert response.status_code == 200, f"Full fields submission failed: {response.text}"
        data = response.json()
        
        # Verify all fields are stored correctly
        token = self.get_admin_token()
        sub_response = requests.get(
            f"{BASE_URL}/api/grower/submissions",
            headers={"Authorization": f"Bearer {token}"}
        )
        submissions = sub_response.json()
        our_sub = next((s for s in submissions if s['id'] == data['submission_id']), None)
        
        assert our_sub is not None
        assert our_sub.get('export_country') == 'Switzerland'
        assert our_sub.get('is_irradiated') == 'No'
        assert our_sub.get('willing_to_irradiate') == 'Yes'
        assert our_sub.get('image_path') is not None
        assert our_sub.get('growing_method') == 'Greenhouse'
        
        print(f"✅ Full submission with all new fields successful")
        print(f"   export_country: {our_sub.get('export_country')}")
        print(f"   is_irradiated: {our_sub.get('is_irradiated')}")
        print(f"   willing_to_irradiate: {our_sub.get('willing_to_irradiate')}")
        print(f"   image_path: {our_sub.get('image_path')}")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
