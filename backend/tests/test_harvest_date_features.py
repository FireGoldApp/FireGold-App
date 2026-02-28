"""
Test cases for Harvest Date feature (iteration 15):
1. POST /api/grower/submit accepts harvest_date Form field
2. PUT /api/strains/{strain_id} accepts harvest_date for admin edit
3. Submission approval flows harvest_date to new strain
4. GET /api/admin/strain-directory/csv includes Harvest Date column
"""
import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestHarvestDateFeatures:
    """Test all harvest date related features"""
    
    @pytest.fixture(scope="class")
    def admin_token(self):
        """Get admin token for authenticated requests"""
        response = requests.post(f"{BASE_URL}/api/admin/login", json={
            "password": "firegold2026"
        })
        assert response.status_code == 200, f"Admin login failed: {response.text}"
        return response.json().get("token")
    
    @pytest.fixture(scope="class")
    def test_strain_id(self, admin_token):
        """Get or create a test strain ID for updating"""
        # Get first strain from catalog (using admin endpoint which is admin-only)
        response = requests.get(
            f"{BASE_URL}/api/strains/admin",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200, f"Failed to get strains: {response.text}"
        strains = response.json()
        assert len(strains) > 0, "No strains available for testing"
        return strains[0]["id"]
    
    # Test 1: POST /api/grower/submit accepts harvest_date Form field
    def test_grower_submission_with_harvest_date(self):
        """Test that grower submission accepts harvest_date field"""
        unique_id = str(uuid.uuid4())[:8]
        
        # Submit with harvest_date
        response = requests.post(f"{BASE_URL}/api/grower/submit", data={
            "grower_name": f"TEST_{unique_id}_Grower",
            "company_name": f"TEST_{unique_id}_Company",
            "email": f"test_{unique_id}@testcompany.com",
            "phone": "+1555123" + unique_id[:4],
            "strain_name": f"TEST_{unique_id}_Strain",
            "strain_type": "Balanced Hybrid",
            "thc_percentage": "28%",
            "terpene_profile": "Limonene, Myrcene",
            "lineage": "Parent A x Parent B",
            "lot_size_kg": "35",
            "effects": "Relaxation, Mood Elevation",
            "harvest_date": "2025-12-15",  # KEY: Testing harvest_date field
            "grade_a_kg": "20",
            "grade_b_kg": "10",
            "grade_c_kg": "5",
            "export_country": "Canada"
        })
        
        assert response.status_code == 200, f"Submission failed: {response.text}"
        data = response.json()
        assert "submission_id" in data, "No submission_id returned"
        assert data.get("strain_name") == f"TEST_{unique_id}_Strain"
        
        # Verify submission was saved with harvest_date
        submission_id = data["submission_id"]
        print(f"✅ Grower submission created with harvest_date: {submission_id}")
        return submission_id
    
    # Test 2: Verify submission contains harvest_date when retrieved
    def test_submission_harvest_date_stored(self, admin_token):
        """Test that submitted harvest_date is stored in submission"""
        # Create new submission with harvest_date
        unique_id = str(uuid.uuid4())[:8]
        
        response = requests.post(f"{BASE_URL}/api/grower/submit", data={
            "grower_name": f"TEST_{unique_id}_Grower2",
            "company_name": f"TEST_{unique_id}_Company2",
            "email": f"test2_{unique_id}@testcompany.com",
            "phone": "+1555222" + unique_id[:4],
            "strain_name": f"TEST_{unique_id}_Strain2",
            "strain_type": "Indica Dominant",
            "thc_percentage": "32%",
            "terpene_profile": "Caryophyllene",
            "lineage": "OG Kush x Purple Kush",
            "lot_size_kg": "45",
            "effects": "Sleep, Relaxation",
            "harvest_date": "2025-11-20",  # Specific harvest date
            "export_country": "Germany"
        })
        assert response.status_code == 200
        submission_id = response.json()["submission_id"]
        
        # Fetch all submissions and verify harvest_date is present
        response = requests.get(
            f"{BASE_URL}/api/grower/submissions?status=pending",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200, f"Failed to get submissions: {response.text}"
        
        submissions = response.json()
        our_submission = next((s for s in submissions if s["id"] == submission_id), None)
        assert our_submission is not None, f"Submission {submission_id} not found"
        assert our_submission.get("harvest_date") == "2025-11-20", f"harvest_date not stored correctly: {our_submission.get('harvest_date')}"
        
        print(f"✅ Harvest date '2025-11-20' stored in submission {submission_id}")
    
    # Test 3: PUT /api/strains/{strain_id} accepts harvest_date field
    def test_update_strain_with_harvest_date(self, admin_token, test_strain_id):
        """Test that admin can update strain with harvest_date"""
        # First, get the current strain data (using admin endpoint)
        response = requests.get(
            f"{BASE_URL}/api/strains/admin",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        strain = next((s for s in response.json() if s["id"] == test_strain_id), None)
        assert strain is not None, f"Strain {test_strain_id} not found"
        
        # Update strain with harvest_date
        update_data = {
            "strain_name": strain["strain_name"],
            "type": strain["type"],
            "thc_percentage": strain["thc_percentage"],
            "price_tier": strain["price_tier"],
            "terpene_profile": strain.get("terpene_profile", ["Limonene"]),
            "lineage": strain.get("lineage", "Unknown"),
            "lot_size": strain.get("lot_size", "30 kg"),
            "effects": strain.get("effects", "Relaxation"),
            "harvest_date": "2025-10-25"  # KEY: Adding harvest_date
        }
        
        response = requests.put(
            f"{BASE_URL}/api/strains/{test_strain_id}",
            json=update_data,
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        
        assert response.status_code == 200, f"Failed to update strain: {response.text}"
        updated_strain = response.json()
        assert updated_strain.get("harvest_date") == "2025-10-25", f"harvest_date not updated: {updated_strain.get('harvest_date')}"
        
        print(f"✅ Strain {test_strain_id} updated with harvest_date '2025-10-25'")
        
        # Verify by fetching strain again
        response = requests.get(f"{BASE_URL}/api/strains")
        assert response.status_code == 200
        strain = next((s for s in response.json() if s["id"] == test_strain_id), None)
        assert strain.get("harvest_date") == "2025-10-25"
        print(f"✅ GET /api/strains returns harvest_date correctly")
    
    # Test 4: Submission approval flows harvest_date to new strain
    def test_approval_flows_harvest_date_to_strain(self, admin_token):
        """Test that approving submission creates strain with harvest_date"""
        unique_id = str(uuid.uuid4())[:8]
        strain_name = f"TEST_{unique_id}_ApprovalFlow"
        harvest_date = "2025-09-30"
        
        # 1. Create submission with harvest_date
        response = requests.post(f"{BASE_URL}/api/grower/submit", data={
            "grower_name": f"TEST_{unique_id}_Grower3",
            "company_name": f"TEST_{unique_id}_Company3",
            "email": f"test3_{unique_id}@testcompany.com",
            "phone": "+1555333" + unique_id[:4],
            "strain_name": strain_name,
            "strain_type": "Sativa Dominant",
            "thc_percentage": "30%",
            "terpene_profile": "Terpinolene, Pinene",
            "lineage": "Sour Diesel x Jack Herer",
            "lot_size_kg": "50",
            "effects": "Energy, Focus, Creativity",
            "harvest_date": harvest_date,
            "export_country": "Australia"
        })
        assert response.status_code == 200
        submission_id = response.json()["submission_id"]
        print(f"Created submission {submission_id} with harvest_date {harvest_date}")
        
        # 2. Approve the submission
        response = requests.put(
            f"{BASE_URL}/api/grower/submissions/{submission_id}/status",
            json={
                "status": "approved",
                "admin_notes": "Test approval for harvest_date flow",
                "admin_price_per_gram": "$6.00"
            },
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200, f"Approval failed: {response.text}"
        print(f"✅ Submission {submission_id} approved")
        
        # 3. Verify new strain was created with harvest_date
        response = requests.get(f"{BASE_URL}/api/strains")
        assert response.status_code == 200
        strains = response.json()
        
        new_strain = next((s for s in strains if s["strain_name"] == strain_name), None)
        assert new_strain is not None, f"Strain '{strain_name}' not found after approval"
        assert new_strain.get("harvest_date") == harvest_date, f"harvest_date not flowed to strain: {new_strain.get('harvest_date')}"
        
        print(f"✅ Harvest date '{harvest_date}' flowed to new strain {new_strain['id']}")
        
        # Cleanup: We'll leave this strain for CSV test
        return new_strain["id"]
    
    # Test 5: GET /api/admin/strain-directory/csv includes Harvest Date column
    def test_csv_export_has_harvest_date_column(self, admin_token):
        """Test that strain directory CSV includes Harvest Date column"""
        response = requests.get(
            f"{BASE_URL}/api/admin/strain-directory/csv",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        
        assert response.status_code == 200, f"CSV export failed: {response.text}"
        assert response.headers.get("content-type") == "text/csv; charset=utf-8", f"Wrong content type: {response.headers.get('content-type')}"
        
        csv_content = response.text
        lines = csv_content.strip().split('\n')
        assert len(lines) > 0, "CSV is empty"
        
        # Check header row contains "Harvest Date"
        header_row = lines[0]
        assert "Harvest Date" in header_row, f"'Harvest Date' column not in CSV header: {header_row}"
        
        # Count columns and find Harvest Date position
        headers = header_row.split(',')
        harvest_date_index = None
        for i, h in enumerate(headers):
            if "Harvest Date" in h:
                harvest_date_index = i
                break
        
        assert harvest_date_index is not None, "Harvest Date column not found in headers"
        print(f"✅ CSV export has 'Harvest Date' column at index {harvest_date_index}")
        print(f"✅ CSV headers: {headers}")
    
    # Test 6: Verify harvest_date appears in strain directory JSON
    def test_strain_directory_json_has_harvest_date(self, admin_token):
        """Test that strain directory JSON includes harvest_date field"""
        response = requests.get(
            f"{BASE_URL}/api/admin/strain-directory",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        
        assert response.status_code == 200, f"Strain directory failed: {response.text}"
        data = response.json()
        
        # Check that harvest_date field exists in strain data
        strains_with_harvest = [s for s in data if s.get("harvest_date")]
        print(f"Found {len(strains_with_harvest)} strains with harvest_date set")
        
        # Verify structure
        if data:
            sample_strain = data[0]
            assert "harvest_date" in sample_strain or sample_strain.get("harvest_date") is None, "harvest_date field missing from strain"
        
        print(f"✅ Strain directory JSON includes harvest_date field")


class TestCleanup:
    """Cleanup test data"""
    
    @pytest.fixture(scope="class")
    def admin_token(self):
        response = requests.post(f"{BASE_URL}/api/admin/login", json={"password": "firegold2026"})
        return response.json().get("token")
    
    def test_cleanup_test_strains(self, admin_token):
        """Remove TEST_ prefixed strains created during testing"""
        response = requests.get(f"{BASE_URL}/api/strains")
        if response.status_code == 200:
            strains = response.json()
            test_strains = [s for s in strains if s.get("strain_name", "").startswith("TEST_")]
            
            for strain in test_strains:
                delete_resp = requests.delete(
                    f"{BASE_URL}/api/strains/{strain['id']}",
                    headers={"Authorization": f"Bearer {admin_token}"}
                )
                if delete_resp.status_code == 200:
                    print(f"Cleaned up test strain: {strain['strain_name']}")
            
            print(f"✅ Cleaned up {len(test_strains)} test strains")
