"""
Test suite for Grower Submission endpoints
Tests: POST /api/grower/submit, GET /api/grower/submissions, PUT /api/grower/submissions/{id}/status
"""
import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')
ADMIN_PASSWORD = "firegold2026"

class TestGrowerSubmissionAPI:
    """Grower submission endpoint tests"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup for each test"""
        self.admin_token = None
        # Unique test identifier to avoid conflicts
        self.test_id = str(uuid.uuid4())[:8]
    
    def get_admin_token(self):
        """Get admin authentication token"""
        response = requests.post(f"{BASE_URL}/api/admin/login", json={"password": ADMIN_PASSWORD})
        assert response.status_code == 200, f"Admin login failed: {response.text}"
        return response.json()["token"]
    
    # =====================
    # POST /api/grower/submit tests
    # =====================
    
    def test_grower_submit_success(self):
        """Test successful strain submission with valid data (30+ kg lot)"""
        payload = {
            "grower_name": f"TEST_Grower_{self.test_id}",
            "company_name": f"TEST_Company_{self.test_id}",
            "email": f"test_{self.test_id}@example.com",
            "phone": "+1 555-000-0000",
            "license_number": "LIC-TEST-001",
            "strain_name": f"TEST_Strain_{self.test_id}",
            "strain_type": "Balanced Hybrid",
            "thc_percentage": "28.5%",
            "cbd_percentage": "0.5%",
            "terpene_profile": "Limonene, Caryophyllene, Myrcene",
            "lineage": "OG Kush x Blue Dream",
            "lot_size_kg": 50.0,  # 50 kg - above 30 kg minimum
            "effects": "Relaxation, Mood Elevation",
            "growing_method": "Indoor",
            "additional_notes": "Test submission"
        }
        
        response = requests.post(f"{BASE_URL}/api/grower/submit", json=payload)
        
        # Status assertion
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        # Data assertions
        data = response.json()
        assert "submission_id" in data, "Response should contain submission_id"
        assert "message" in data, "Response should contain message"
        assert data["strain_name"] == payload["strain_name"], "Strain name should match"
        assert "received" in data["message"].lower(), "Message should indicate submission received"
        
        print(f"✅ Submission successful: ID={data['submission_id']}")
        return data["submission_id"]
    
    def test_grower_submit_rejects_below_30kg(self):
        """Test that submission is rejected when lot_size_kg < 30"""
        payload = {
            "grower_name": f"TEST_Grower_{self.test_id}",
            "company_name": f"TEST_Company_Below30_{self.test_id}",
            "email": f"test_below30_{self.test_id}@example.com",
            "phone": "+1 555-000-0001",
            "strain_name": f"TEST_Strain_Below30_{self.test_id}",
            "strain_type": "Indica Dominant",
            "thc_percentage": "25%",
            "terpene_profile": "Myrcene, Linalool",
            "lineage": "Northern Lights x Skunk",
            "lot_size_kg": 25.0,  # 25 kg - below 30 kg minimum
            "effects": "Relaxation, Sleep"
        }
        
        response = requests.post(f"{BASE_URL}/api/grower/submit", json=payload)
        
        # Status assertion - should be 400 Bad Request
        assert response.status_code == 400, f"Expected 400 for <30kg, got {response.status_code}: {response.text}"
        
        # Data assertions
        data = response.json()
        assert "detail" in data, "Error response should contain detail"
        assert "30" in data["detail"], "Error should mention 30 kg minimum"
        
        print(f"✅ Correctly rejected <30kg submission: {data['detail']}")
    
    def test_grower_submit_rejects_exactly_29kg(self):
        """Test that submission is rejected when lot_size_kg = 29 (boundary test)"""
        payload = {
            "grower_name": f"TEST_Grower_{self.test_id}",
            "company_name": f"TEST_Company_29kg_{self.test_id}",
            "email": f"test_29kg_{self.test_id}@example.com",
            "phone": "+1 555-000-0002",
            "strain_name": f"TEST_Strain_29kg_{self.test_id}",
            "strain_type": "Sativa Dominant",
            "thc_percentage": "30%",
            "terpene_profile": "Terpinolene, Limonene",
            "lineage": "Durban Poison",
            "lot_size_kg": 29.0,  # Exactly 29 kg - should be rejected
            "effects": "Energy, Focus"
        }
        
        response = requests.post(f"{BASE_URL}/api/grower/submit", json=payload)
        
        # Status assertion
        assert response.status_code == 400, f"Expected 400 for 29kg, got {response.status_code}"
        
        print(f"✅ Correctly rejected 29kg submission")
    
    def test_grower_submit_accepts_exactly_30kg(self):
        """Test that submission is accepted when lot_size_kg = 30 (boundary test)"""
        payload = {
            "grower_name": f"TEST_Grower_{self.test_id}",
            "company_name": f"TEST_Company_30kg_{self.test_id}",
            "email": f"test_30kg_{self.test_id}@example.com",
            "phone": "+1 555-000-0003",
            "strain_name": f"TEST_Strain_30kg_{self.test_id}",
            "strain_type": "Balanced Hybrid",
            "thc_percentage": "27%",
            "terpene_profile": "Caryophyllene",
            "lineage": "Wedding Cake",
            "lot_size_kg": 30.0,  # Exactly 30 kg - should be accepted
            "effects": "Calm, Happy"
        }
        
        response = requests.post(f"{BASE_URL}/api/grower/submit", json=payload)
        
        # Status assertion
        assert response.status_code == 200, f"Expected 200 for exactly 30kg, got {response.status_code}: {response.text}"
        
        # Data assertions
        data = response.json()
        assert "submission_id" in data
        
        print(f"✅ Accepted exactly 30kg submission: ID={data['submission_id']}")
    
    def test_grower_submit_rejects_duplicate_pending(self):
        """Test that duplicate pending submissions from same company are rejected"""
        # First submission
        payload = {
            "grower_name": f"TEST_Grower_{self.test_id}",
            "company_name": f"TEST_DuplicateCompany_{self.test_id}",
            "email": f"test_dup_{self.test_id}@example.com",
            "phone": "+1 555-000-0004",
            "strain_name": f"TEST_DuplicateStrain_{self.test_id}",
            "strain_type": "Hybrid, Indica Leaning",
            "thc_percentage": "32%",
            "terpene_profile": "Limonene, Myrcene",
            "lineage": "Gelato x Biscotti",
            "lot_size_kg": 40.0,
            "effects": "Euphoria, Relaxation"
        }
        
        # First submission should succeed
        response1 = requests.post(f"{BASE_URL}/api/grower/submit", json=payload)
        assert response1.status_code == 200, f"First submission should succeed: {response1.text}"
        
        # Second identical submission should be rejected
        response2 = requests.post(f"{BASE_URL}/api/grower/submit", json=payload)
        
        # Status assertion
        assert response2.status_code == 400, f"Expected 400 for duplicate, got {response2.status_code}: {response2.text}"
        
        # Data assertions
        data = response2.json()
        assert "detail" in data
        assert "pending" in data["detail"].lower() or "already" in data["detail"].lower()
        
        print(f"✅ Correctly rejected duplicate pending submission")
    
    # =====================
    # GET /api/grower/submissions tests (admin only)
    # =====================
    
    def test_get_submissions_requires_auth(self):
        """Test that GET /api/grower/submissions requires admin auth"""
        response = requests.get(f"{BASE_URL}/api/grower/submissions")
        
        # Should return 401 without token
        assert response.status_code == 401, f"Expected 401 without auth, got {response.status_code}"
        
        print("✅ GET submissions correctly requires auth")
    
    def test_get_submissions_with_admin_token(self):
        """Test GET /api/grower/submissions returns submissions for admin"""
        token = self.get_admin_token()
        
        response = requests.get(
            f"{BASE_URL}/api/grower/submissions",
            headers={"Authorization": f"Bearer {token}"}
        )
        
        # Status assertion
        assert response.status_code == 200, f"Expected 200 with admin token, got {response.status_code}"
        
        # Data assertions
        data = response.json()
        assert isinstance(data, list), "Response should be a list"
        
        # Each submission should have required fields
        if len(data) > 0:
            sub = data[0]
            assert "id" in sub, "Submission should have id"
            assert "strain_name" in sub, "Submission should have strain_name"
            assert "status" in sub, "Submission should have status"
            assert "lot_size_kg" in sub, "Submission should have lot_size_kg"
        
        print(f"✅ Retrieved {len(data)} submissions")
        return data
    
    def test_get_submissions_filter_by_status(self):
        """Test filtering submissions by status"""
        token = self.get_admin_token()
        
        for status in ["pending", "approved", "rejected"]:
            response = requests.get(
                f"{BASE_URL}/api/grower/submissions?status={status}",
                headers={"Authorization": f"Bearer {token}"}
            )
            
            assert response.status_code == 200, f"Expected 200 for status filter '{status}'"
            
            data = response.json()
            # All returned submissions should have the filtered status
            for sub in data:
                assert sub["status"] == status, f"Submission status should be {status}"
        
        print("✅ Status filtering works correctly")
    
    # =====================
    # PUT /api/grower/submissions/{id}/status tests
    # =====================
    
    def test_update_submission_status_approve_with_price(self):
        """Test approving a submission with price_per_gram adds strain to catalog"""
        token = self.get_admin_token()
        
        # First create a submission to approve
        payload = {
            "grower_name": f"TEST_Grower_Approve_{self.test_id}",
            "company_name": f"TEST_Company_Approve_{self.test_id}",
            "email": f"test_approve_{self.test_id}@example.com",
            "phone": "+1 555-000-0005",
            "strain_name": f"TEST_Approve_Strain_{self.test_id}",
            "strain_type": "Indica Dominant",
            "thc_percentage": "29%",
            "terpene_profile": "Myrcene, Linalool, Caryophyllene",
            "lineage": "Granddaddy Purple x OG Kush",
            "lot_size_kg": 45.0,
            "effects": "Relaxation, Sleep, Pain Relief"
        }
        
        submit_response = requests.post(f"{BASE_URL}/api/grower/submit", json=payload)
        assert submit_response.status_code == 200, f"Submission failed: {submit_response.text}"
        submission_id = submit_response.json()["submission_id"]
        
        # Approve with price_per_gram = $7.00 (should be $$)
        update_body = {
            "status": "approved",
            "admin_notes": "Quality verified",
            "admin_price_per_gram": "7.00"
        }
        
        update_response = requests.put(
            f"{BASE_URL}/api/grower/submissions/{submission_id}/status",
            json=update_body,
            headers={"Authorization": f"Bearer {token}"}
        )
        
        # Status assertion
        assert update_response.status_code == 200, f"Expected 200 for approve, got {update_response.status_code}: {update_response.text}"
        
        # Data assertions
        data = update_response.json()
        assert "submission_id" in data, "Response should contain submission_id"
        assert submission_id in data["submission_id"], "Submission ID should match"
        
        # Verify strain was added to catalog
        strains_response = requests.get(
            f"{BASE_URL}/api/strains/admin",
            headers={"Authorization": f"Bearer {token}"}
        )
        assert strains_response.status_code == 200
        
        strains = strains_response.json()
        approved_strain = next((s for s in strains if s["strain_name"] == payload["strain_name"]), None)
        
        # Verify the strain exists in catalog with correct price tier
        assert approved_strain is not None, "Approved strain should be in catalog"
        assert approved_strain["price_tier"] == "$$", f"Price tier for $7/g should be $$, got {approved_strain['price_tier']}"
        
        print(f"✅ Approved submission and verified strain in catalog with price tier $$")
    
    def test_update_submission_status_price_tier_dollar(self):
        """Test that price < $5 sets price tier to $"""
        token = self.get_admin_token()
        
        # Create submission
        payload = {
            "grower_name": f"TEST_Grower_Dollar_{self.test_id}",
            "company_name": f"TEST_Company_Dollar_{self.test_id}",
            "email": f"test_dollar_{self.test_id}@example.com",
            "phone": "+1 555-000-0006",
            "strain_name": f"TEST_Dollar_Strain_{self.test_id}",
            "strain_type": "Hybrid, Sativa Leaning",
            "thc_percentage": "24%",
            "terpene_profile": "Pinene, Limonene",
            "lineage": "Sour Diesel",
            "lot_size_kg": 60.0,
            "effects": "Energy, Creativity"
        }
        
        submit_response = requests.post(f"{BASE_URL}/api/grower/submit", json=payload)
        assert submit_response.status_code == 200
        submission_id = submit_response.json()["submission_id"]
        
        # Approve with price = $4.50 (should be $)
        update_response = requests.put(
            f"{BASE_URL}/api/grower/submissions/{submission_id}/status",
            json={"status": "approved", "admin_price_per_gram": "4.50"},
            headers={"Authorization": f"Bearer {token}"}
        )
        
        assert update_response.status_code == 200
        
        # Verify price tier
        strains_response = requests.get(
            f"{BASE_URL}/api/strains/admin",
            headers={"Authorization": f"Bearer {token}"}
        )
        strains = strains_response.json()
        approved_strain = next((s for s in strains if s["strain_name"] == payload["strain_name"]), None)
        
        assert approved_strain is not None
        assert approved_strain["price_tier"] == "$", f"Price tier for $4.50/g should be $, got {approved_strain['price_tier']}"
        
        print("✅ Price tier $ correctly set for <$5/g")
    
    def test_update_submission_status_price_tier_triple_dollar(self):
        """Test that price >= $8 sets price tier to $$$"""
        token = self.get_admin_token()
        
        # Create submission
        payload = {
            "grower_name": f"TEST_Grower_Premium_{self.test_id}",
            "company_name": f"TEST_Company_Premium_{self.test_id}",
            "email": f"test_premium_{self.test_id}@example.com",
            "phone": "+1 555-000-0007",
            "strain_name": f"TEST_Premium_Strain_{self.test_id}",
            "strain_type": "Indica Dominant",
            "thc_percentage": "35%",
            "terpene_profile": "Caryophyllene, Limonene, Myrcene",
            "lineage": "GMO x MAC",
            "lot_size_kg": 35.0,
            "effects": "Potent Relaxation, Euphoria"
        }
        
        submit_response = requests.post(f"{BASE_URL}/api/grower/submit", json=payload)
        assert submit_response.status_code == 200
        submission_id = submit_response.json()["submission_id"]
        
        # Approve with price = $9.00 (should be $$$)
        update_response = requests.put(
            f"{BASE_URL}/api/grower/submissions/{submission_id}/status",
            json={"status": "approved", "admin_price_per_gram": "9.00"},
            headers={"Authorization": f"Bearer {token}"}
        )
        
        assert update_response.status_code == 200
        
        # Verify price tier
        strains_response = requests.get(
            f"{BASE_URL}/api/strains/admin",
            headers={"Authorization": f"Bearer {token}"}
        )
        strains = strains_response.json()
        approved_strain = next((s for s in strains if s["strain_name"] == payload["strain_name"]), None)
        
        assert approved_strain is not None
        assert approved_strain["price_tier"] == "$$$", f"Price tier for $9/g should be $$$, got {approved_strain['price_tier']}"
        
        print("✅ Price tier $$$ correctly set for >=$8/g")
    
    def test_update_submission_status_reject(self):
        """Test rejecting a submission"""
        token = self.get_admin_token()
        
        # Create submission
        payload = {
            "grower_name": f"TEST_Grower_Reject_{self.test_id}",
            "company_name": f"TEST_Company_Reject_{self.test_id}",
            "email": f"test_reject_{self.test_id}@example.com",
            "phone": "+1 555-000-0008",
            "strain_name": f"TEST_Reject_Strain_{self.test_id}",
            "strain_type": "Balanced Hybrid",
            "thc_percentage": "22%",
            "terpene_profile": "Myrcene",
            "lineage": "Unknown",
            "lot_size_kg": 30.0,
            "effects": "Mild Effects"
        }
        
        submit_response = requests.post(f"{BASE_URL}/api/grower/submit", json=payload)
        assert submit_response.status_code == 200
        submission_id = submit_response.json()["submission_id"]
        
        # Reject the submission
        update_response = requests.put(
            f"{BASE_URL}/api/grower/submissions/{submission_id}/status",
            json={"status": "rejected", "admin_notes": "Does not meet quality standards"},
            headers={"Authorization": f"Bearer {token}"}
        )
        
        assert update_response.status_code == 200
        
        # Verify submission is rejected
        submissions_response = requests.get(
            f"{BASE_URL}/api/grower/submissions",
            headers={"Authorization": f"Bearer {token}"}
        )
        submissions = submissions_response.json()
        rejected_sub = next((s for s in submissions if s["id"] == submission_id), None)
        
        assert rejected_sub is not None
        assert rejected_sub["status"] == "rejected"
        assert rejected_sub["admin_notes"] == "Does not meet quality standards"
        
        print("✅ Submission rejection works correctly")
    
    def test_update_submission_requires_admin_auth(self):
        """Test that updating submission status requires admin auth"""
        response = requests.put(
            f"{BASE_URL}/api/grower/submissions/fake-id/status",
            json={"status": "approved"}
        )
        
        assert response.status_code == 401, f"Expected 401 without auth, got {response.status_code}"
        
        print("✅ Update submission correctly requires auth")
    
    def test_update_nonexistent_submission(self):
        """Test updating a non-existent submission returns 404"""
        token = self.get_admin_token()
        
        response = requests.put(
            f"{BASE_URL}/api/grower/submissions/nonexistent-id-12345/status",
            json={"status": "approved"},
            headers={"Authorization": f"Bearer {token}"}
        )
        
        assert response.status_code == 404, f"Expected 404 for nonexistent submission, got {response.status_code}"
        
        print("✅ Nonexistent submission returns 404")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
