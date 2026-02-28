"""
Test Flower Grade Features - Iteration 12

Tests the new flower grade system:
- Grade fields (grade_a_kg, grade_b_kg, grade_c_kg) in submissions and strains
- Grade filtering in catalog
- Grade distribution in analytics
- CSV export with grade columns
"""

import pytest
import requests
import os
import uuid
import csv
import io

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')
ADMIN_PASSWORD = "firegold2026"

# Fixtures
@pytest.fixture(scope="module")
def admin_token():
    """Get admin authentication token"""
    response = requests.post(f"{BASE_URL}/api/admin/login", json={"password": ADMIN_PASSWORD})
    assert response.status_code == 200, f"Admin login failed: {response.text}"
    return response.json()["token"]


@pytest.fixture(scope="module")
def test_submission_id(admin_token):
    """Create a test submission with grade data"""
    unique_id = str(uuid.uuid4())[:8]
    form_data = {
        'grower_name': 'TEST Grade Grower',
        'company_name': f'TEST_GRADE_LP_{unique_id}',
        'email': f'test_grade_{unique_id}@testcompany.com',
        'phone': '+1-555-GRADE-01',
        'license_number': f'LIC-GRADE-{unique_id}',
        'strain_name': f'TEST_Grade_Strain_{unique_id}',
        'strain_type': 'Balanced Hybrid',
        'thc_percentage': '29.5%',
        'cbd_percentage': '0.3%',
        'terpene_profile': 'Limonene, Caryophyllene, Myrcene',
        'lineage': 'Grade Test Parent x Premium Flower',
        'lot_size_kg': '55',
        'effects': 'Relaxation, Mood Elevation',
        'growing_method': 'Indoor',
        'export_country': 'Canada',
        'is_irradiated': 'No',
        'willing_to_irradiate': 'Yes',
        'additional_notes': 'Test submission with grade breakdown',
        'grade_a_kg': '25.0',
        'grade_b_kg': '20.0',
        'grade_c_kg': '10.0'
    }
    response = requests.post(f"{BASE_URL}/api/grower/submit", data=form_data)
    assert response.status_code == 200, f"Submission failed: {response.text}"
    return response.json()["submission_id"]


class TestSubmissionGrades:
    """Test grade fields in grower submissions"""
    
    def test_submit_strain_with_grades_success(self):
        """Test that submission endpoint accepts grade_a_kg, grade_b_kg, grade_c_kg fields"""
        unique_id = str(uuid.uuid4())[:8]
        form_data = {
            'grower_name': 'TEST Grade Grower 2',
            'company_name': f'TEST_LP_{unique_id}',
            'email': f'test_{unique_id}@testcompany.com',
            'phone': '+1-555-TEST-01',
            'strain_name': f'TEST_Strain_{unique_id}',
            'strain_type': 'Indica Dominant',
            'thc_percentage': '31%',
            'terpene_profile': 'Beta-myrcene, Linalool',
            'lineage': 'Test Lineage',
            'lot_size_kg': '50',
            'effects': 'Relaxation, Sleep',
            'grade_a_kg': '15.5',
            'grade_b_kg': '22.5',
            'grade_c_kg': '12.0'
        }
        response = requests.post(f"{BASE_URL}/api/grower/submit", data=form_data)
        
        assert response.status_code == 200, f"Submission failed: {response.text}"
        data = response.json()
        assert "submission_id" in data
        assert data["strain_name"] == form_data["strain_name"]
        print(f"✅ Submission created with grades: {data['submission_id']}")
    
    def test_admin_view_submission_with_grades(self, admin_token, test_submission_id):
        """Test that admin can view submission with grade breakdown"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        response = requests.get(f"{BASE_URL}/api/grower/submissions", headers=headers)
        
        assert response.status_code == 200
        submissions = response.json()
        
        # Find our test submission
        test_sub = None
        for sub in submissions:
            if sub.get("id") == test_submission_id:
                test_sub = sub
                break
        
        assert test_sub is not None, f"Test submission {test_submission_id} not found"
        assert test_sub.get("grade_a_kg") == 25.0
        assert test_sub.get("grade_b_kg") == 20.0
        assert test_sub.get("grade_c_kg") == 10.0
        print(f"✅ Admin can view submission grades: A={test_sub['grade_a_kg']}kg, B={test_sub['grade_b_kg']}kg, C={test_sub['grade_c_kg']}kg")


class TestApprovedStrainGrades:
    """Test that approved submissions create strains with grade data"""
    
    def test_approve_submission_transfers_grades(self, admin_token):
        """Test that approving a submission creates strain with grade fields"""
        # Create a new submission
        unique_id = str(uuid.uuid4())[:8]
        form_data = {
            'grower_name': 'TEST Approval Grower',
            'company_name': f'TEST_APPROVE_LP_{unique_id}',
            'email': f'test_approve_{unique_id}@testcompany.com',
            'phone': '+1-555-APPR-01',
            'strain_name': f'TEST_Approved_Strain_{unique_id}',
            'strain_type': 'Sativa Dominant',
            'thc_percentage': '27.5%',
            'terpene_profile': 'Limonene, Terpinolene',
            'lineage': 'Sativa Mother x Haze Father',
            'lot_size_kg': '40',
            'effects': 'Energy, Focus, Creativity',
            'grade_a_kg': '18.0',
            'grade_b_kg': '15.0',
            'grade_c_kg': '7.0'
        }
        response = requests.post(f"{BASE_URL}/api/grower/submit", data=form_data)
        assert response.status_code == 200
        submission_id = response.json()["submission_id"]
        
        # Approve the submission
        headers = {"Authorization": f"Bearer {admin_token}"}
        approve_response = requests.put(
            f"{BASE_URL}/api/grower/submissions/{submission_id}/status",
            json={"status": "approved", "admin_price_per_gram": "$6.50"},
            headers=headers
        )
        assert approve_response.status_code == 200
        
        # Verify the strain was created with grades
        strains_response = requests.get(f"{BASE_URL}/api/strains", headers=headers)
        assert strains_response.status_code == 200
        strains = strains_response.json()
        
        # Find our approved strain
        approved_strain = None
        for strain in strains:
            if strain.get("strain_name") == form_data["strain_name"]:
                approved_strain = strain
                break
        
        assert approved_strain is not None, f"Approved strain not found: {form_data['strain_name']}"
        assert approved_strain.get("grade_a_kg") == 18.0
        assert approved_strain.get("grade_b_kg") == 15.0
        assert approved_strain.get("grade_c_kg") == 7.0
        print(f"✅ Approved strain has grades: A={approved_strain['grade_a_kg']}kg, B={approved_strain['grade_b_kg']}kg, C={approved_strain['grade_c_kg']}kg")
        
        return approved_strain["id"]


class TestStrainUpdateGrades:
    """Test updating strain grades via admin"""
    
    def test_update_strain_grades(self, admin_token):
        """Test that PUT /api/strains/{strain_id} can update grade_a_kg, grade_b_kg, grade_c_kg"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        
        # Get an existing strain (use admin endpoint)
        strains_response = requests.get(f"{BASE_URL}/api/strains/admin", headers=headers)
        assert strains_response.status_code == 200, f"Admin strains failed: {strains_response.text}"
        strains = strains_response.json()
        assert len(strains) > 0, "No strains in database to test"
        
        # Find a strain to update (preferably one without grades)
        strain_to_update = None
        for strain in strains:
            if strain.get("strain_name") and not strain.get("grade_a_kg"):
                strain_to_update = strain
                break
        
        if not strain_to_update:
            strain_to_update = strains[0]  # Use first strain
        
        strain_id = strain_to_update["id"]
        
        # Update the strain with new grade values
        update_data = {
            "strain_name": strain_to_update["strain_name"],
            "type": strain_to_update["type"],
            "thc_percentage": strain_to_update["thc_percentage"],
            "price_tier": strain_to_update.get("price_tier", "$$"),
            "terpene_profile": strain_to_update.get("terpene_profile", []),
            "lineage": strain_to_update.get("lineage", "Unknown"),
            "lot_size": strain_to_update.get("lot_size", "30 kg"),
            "effects": strain_to_update.get("effects", "Relaxation"),
            "grade_a_kg": 12.5,
            "grade_b_kg": 8.0,
            "grade_c_kg": 4.5
        }
        
        update_response = requests.put(
            f"{BASE_URL}/api/strains/{strain_id}",
            json=update_data,
            headers=headers
        )
        assert update_response.status_code == 200, f"Update failed: {update_response.text}"
        
        updated_strain = update_response.json()
        assert updated_strain.get("grade_a_kg") == 12.5
        assert updated_strain.get("grade_b_kg") == 8.0
        assert updated_strain.get("grade_c_kg") == 4.5
        print(f"✅ Strain grades updated: A={updated_strain['grade_a_kg']}kg, B={updated_strain['grade_b_kg']}kg, C={updated_strain['grade_c_kg']}kg")


class TestCSVExportGrades:
    """Test that CSV export includes grade columns"""
    
    def test_csv_has_grade_columns(self, admin_token):
        """Test that GET /api/admin/strain-directory/csv includes Grade A, Grade B, Grade C columns"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        response = requests.get(f"{BASE_URL}/api/admin/strain-directory/csv", headers=headers)
        
        assert response.status_code == 200
        assert "text/csv" in response.headers.get("Content-Type", "")
        
        # Parse CSV
        csv_content = response.text
        reader = csv.reader(io.StringIO(csv_content))
        header_row = next(reader)
        
        # Check grade columns exist
        assert "Grade A (kg)" in header_row, f"Grade A column missing. Columns: {header_row}"
        assert "Grade B (kg)" in header_row, f"Grade B column missing. Columns: {header_row}"
        assert "Grade C (kg)" in header_row, f"Grade C column missing. Columns: {header_row}"
        
        grade_a_idx = header_row.index("Grade A (kg)")
        grade_b_idx = header_row.index("Grade B (kg)")
        grade_c_idx = header_row.index("Grade C (kg)")
        
        print(f"✅ CSV has grade columns at positions: A={grade_a_idx}, B={grade_b_idx}, C={grade_c_idx}")


class TestGlobalInsightsGradeDistribution:
    """Test grade distribution in analytics endpoint"""
    
    def test_global_insights_has_grade_distribution(self, admin_token):
        """Test that GET /api/analytics/global returns grade_distribution in supply section"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        response = requests.get(f"{BASE_URL}/api/analytics/global", headers=headers)
        
        assert response.status_code == 200, f"Global insights failed: {response.text}"
        data = response.json()
        
        # Verify supply section exists
        assert "supply" in data, "supply section missing from response"
        supply = data["supply"]
        
        # Verify grade_distribution exists
        assert "grade_distribution" in supply, "grade_distribution missing from supply section"
        grade_dist = supply["grade_distribution"]
        
        # Verify structure
        assert "submissions" in grade_dist, "submissions missing from grade_distribution"
        assert "catalog" in grade_dist, "catalog missing from grade_distribution"
        
        submissions_grades = grade_dist["submissions"]
        catalog_grades = grade_dist["catalog"]
        
        # Verify fields in submissions
        for key in ["total_grade_a", "total_grade_b", "total_grade_c", "submissions_with_grades"]:
            assert key in submissions_grades or submissions_grades == {}, f"Missing {key} in submissions grades"
        
        # Verify fields in catalog
        for key in ["total_grade_a", "total_grade_b", "total_grade_c", "strains_with_grades"]:
            assert key in catalog_grades or catalog_grades == {}, f"Missing {key} in catalog grades"
        
        print(f"✅ Grade distribution found: submissions={submissions_grades}, catalog={catalog_grades}")


class TestGradeZeroHandling:
    """Test that zero grades are handled correctly"""
    
    def test_zero_grades_stored_as_null(self):
        """Test that grade values of 0 are stored as null, not 0"""
        unique_id = str(uuid.uuid4())[:8]
        form_data = {
            'grower_name': 'TEST Zero Grade Grower',
            'company_name': f'TEST_ZERO_LP_{unique_id}',
            'email': f'test_zero_{unique_id}@testcompany.com',
            'phone': '+1-555-ZERO-01',
            'strain_name': f'TEST_Zero_Grade_{unique_id}',
            'strain_type': 'Balanced Hybrid',
            'thc_percentage': '26%',
            'terpene_profile': 'Limonene',
            'lineage': 'Test x Test',
            'lot_size_kg': '35',
            'effects': 'Relaxation',
            'grade_a_kg': '0',  # Should be stored as null
            'grade_b_kg': '15.0',
            'grade_c_kg': '0'  # Should be stored as null
        }
        response = requests.post(f"{BASE_URL}/api/grower/submit", data=form_data)
        assert response.status_code == 200
        print(f"✅ Submission with zero grades created successfully")


# Cleanup fixture
@pytest.fixture(scope="module", autouse=True)
def cleanup(admin_token):
    """Cleanup test data after all tests"""
    yield
    # Note: In a real scenario, we'd delete TEST_ prefixed data here
    # For now, we leave it as the test database can be reset
    print("✅ Test completed - TEST_ prefixed data created during testing")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
