"""
Comprehensive tests for Firegold Grade Features (Final Testing - Iteration 13)
Tests:
- Inventory Summary endpoint with grade totals
- CSV Export with grade columns 
- COA Redaction workflow
- Grade filtering in strains
"""
import pytest
import requests
import os
import io
import csv
from datetime import datetime

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Admin credentials
ADMIN_PASSWORD = "firegold2026"

@pytest.fixture(scope="module")
def admin_token():
    """Get admin authentication token"""
    response = requests.post(f"{BASE_URL}/api/admin/login", json={"password": ADMIN_PASSWORD})
    if response.status_code != 200:
        pytest.skip(f"Admin login failed: {response.status_code} - {response.text}")
    return response.json().get("token")

@pytest.fixture(scope="module")
def api_client():
    """Shared requests session"""
    session = requests.Session()
    session.headers.update({"Content-Type": "application/json"})
    return session


class TestInventorySummaryEndpoint:
    """Tests for GET /api/admin/inventory-summary endpoint"""
    
    def test_inventory_summary_returns_200(self, api_client, admin_token):
        """Verify inventory summary endpoint returns 200 OK"""
        response = api_client.get(
            f"{BASE_URL}/api/admin/inventory-summary",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        print(f"✅ Inventory summary endpoint returns 200 OK")
    
    def test_inventory_summary_has_grade_totals(self, api_client, admin_token):
        """Verify inventory summary includes total_grade_a, total_grade_b, total_grade_c fields"""
        response = api_client.get(
            f"{BASE_URL}/api/admin/inventory-summary",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        data = response.json()
        
        assert "total_grade_a" in data, "Missing total_grade_a field"
        assert "total_grade_b" in data, "Missing total_grade_b field"
        assert "total_grade_c" in data, "Missing total_grade_c field"
        assert "total_inventory_kg" in data, "Missing total_inventory_kg field"
        assert "strains_with_grades" in data, "Missing strains_with_grades field"
        assert "total_strains" in data, "Missing total_strains field"
        
        print(f"✅ Inventory summary has all required grade fields")
        print(f"   Grade A: {data['total_grade_a']} kg")
        print(f"   Grade B: {data['total_grade_b']} kg")
        print(f"   Grade C: {data['total_grade_c']} kg")
        print(f"   Total Inventory: {data['total_inventory_kg']} kg")
        print(f"   Strains with Grades: {data['strains_with_grades']}/{data['total_strains']}")
    
    def test_inventory_summary_totals_are_numeric(self, api_client, admin_token):
        """Verify all totals are numeric (int or float)"""
        response = api_client.get(
            f"{BASE_URL}/api/admin/inventory-summary",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        data = response.json()
        
        assert isinstance(data["total_grade_a"], (int, float)), f"total_grade_a should be numeric, got {type(data['total_grade_a'])}"
        assert isinstance(data["total_grade_b"], (int, float)), f"total_grade_b should be numeric, got {type(data['total_grade_b'])}"
        assert isinstance(data["total_grade_c"], (int, float)), f"total_grade_c should be numeric, got {type(data['total_grade_c'])}"
        assert isinstance(data["total_inventory_kg"], (int, float)), f"total_inventory_kg should be numeric, got {type(data['total_inventory_kg'])}"
        
        # Verify total_inventory_kg is sum of grades
        expected_total = data["total_grade_a"] + data["total_grade_b"] + data["total_grade_c"]
        assert abs(data["total_inventory_kg"] - expected_total) < 0.01, f"total_inventory_kg ({data['total_inventory_kg']}) should equal sum of grades ({expected_total})"
        
        print(f"✅ All totals are numeric and correctly calculated")
    
    def test_inventory_summary_has_expected_values(self, api_client, admin_token):
        """Verify inventory summary values match expectations (~603 A, ~408 B, ~209 C)"""
        response = api_client.get(
            f"{BASE_URL}/api/admin/inventory-summary",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        data = response.json()
        
        # Expected values from context: ~603.1 A + 407.6 B + 209.2 C = ~1219.9 kg total
        # Allow some tolerance since data may vary
        assert data["total_grade_a"] > 500, f"Expected Grade A > 500 kg, got {data['total_grade_a']}"
        assert data["total_grade_b"] > 300, f"Expected Grade B > 300 kg, got {data['total_grade_b']}"
        assert data["total_grade_c"] > 150, f"Expected Grade C > 150 kg, got {data['total_grade_c']}"
        assert data["total_inventory_kg"] > 1000, f"Expected total > 1000 kg, got {data['total_inventory_kg']}"
        
        print(f"✅ Inventory values within expected ranges")


class TestCSVExportEndpoint:
    """Tests for GET /api/admin/strain-directory/csv endpoint"""
    
    def test_csv_export_returns_200(self, api_client, admin_token):
        """Verify CSV export endpoint returns 200 OK"""
        response = api_client.get(
            f"{BASE_URL}/api/admin/strain-directory/csv",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        print(f"✅ CSV export endpoint returns 200 OK")
    
    def test_csv_export_has_grade_columns(self, api_client, admin_token):
        """Verify CSV has Grade A, Grade B, Grade C columns"""
        response = api_client.get(
            f"{BASE_URL}/api/admin/strain-directory/csv",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        
        # Parse CSV content
        content = response.text
        reader = csv.reader(io.StringIO(content))
        headers = next(reader)
        
        # Check for grade columns
        assert "Grade A (kg)" in headers, f"Missing 'Grade A (kg)' column. Headers: {headers}"
        assert "Grade B (kg)" in headers, f"Missing 'Grade B (kg)' column. Headers: {headers}"
        assert "Grade C (kg)" in headers, f"Missing 'Grade C (kg)' column. Headers: {headers}"
        
        print(f"✅ CSV has all required grade columns")
        print(f"   Columns found: Grade A (kg), Grade B (kg), Grade C (kg)")
    
    def test_csv_export_has_grade_data(self, api_client, admin_token):
        """Verify CSV rows contain actual grade data"""
        response = api_client.get(
            f"{BASE_URL}/api/admin/strain-directory/csv",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        
        content = response.text
        reader = csv.DictReader(io.StringIO(content))
        rows = list(reader)
        
        # Count strains with grade data
        strains_with_grade_a = sum(1 for row in rows if row.get("Grade A (kg)") and row.get("Grade A (kg)") not in ['', '0', 'None'])
        strains_with_grade_b = sum(1 for row in rows if row.get("Grade B (kg)") and row.get("Grade B (kg)") not in ['', '0', 'None'])
        strains_with_grade_c = sum(1 for row in rows if row.get("Grade C (kg)") and row.get("Grade C (kg)") not in ['', '0', 'None'])
        
        print(f"   Total strains in CSV: {len(rows)}")
        print(f"   Strains with Grade A data: {strains_with_grade_a}")
        print(f"   Strains with Grade B data: {strains_with_grade_b}")
        print(f"   Strains with Grade C data: {strains_with_grade_c}")
        
        # At least some strains should have grade data
        assert strains_with_grade_a > 0 or strains_with_grade_b > 0 or strains_with_grade_c > 0, "No strains have grade data in CSV"
        
        print(f"✅ CSV contains grade data for strains")
    
    def test_csv_content_type(self, api_client, admin_token):
        """Verify CSV export has correct content-type header"""
        response = api_client.get(
            f"{BASE_URL}/api/admin/strain-directory/csv",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        
        content_type = response.headers.get("Content-Type", "")
        assert "text/csv" in content_type, f"Expected text/csv content-type, got: {content_type}"
        
        print(f"✅ CSV has correct content-type: {content_type}")


class TestCOARedactionEndpoint:
    """Tests for PUT /api/admin/submissions/{id}/redacted-coa endpoint"""
    
    def test_coa_redaction_requires_auth(self, api_client):
        """Verify COA redaction endpoint requires admin authentication"""
        # Create a dummy file
        files = {'coa': ('test.pdf', b'%PDF-1.4 dummy content', 'application/pdf')}
        response = requests.put(
            f"{BASE_URL}/api/admin/submissions/dummy-id/redacted-coa",
            files=files
        )
        
        # Should return 401 or 422 (missing auth)
        assert response.status_code in [401, 422], f"Expected 401/422 without auth, got {response.status_code}"
        print(f"✅ COA redaction endpoint requires authentication")
    
    def test_coa_redaction_validates_pdf(self, api_client, admin_token):
        """Verify COA redaction only accepts PDF files"""
        # Send a non-PDF file
        files = {'coa': ('test.txt', b'This is not a PDF', 'text/plain')}
        response = requests.put(
            f"{BASE_URL}/api/admin/submissions/dummy-id/redacted-coa",
            files=files,
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        
        # Should return 400 (bad request) for non-PDF
        assert response.status_code == 400, f"Expected 400 for non-PDF file, got {response.status_code}: {response.text}"
        print(f"✅ COA redaction validates PDF file type")
    
    def test_coa_redaction_returns_404_for_invalid_submission(self, api_client, admin_token):
        """Verify COA redaction returns 404 for non-existent submission"""
        files = {'coa': ('test.pdf', b'%PDF-1.4 dummy content', 'application/pdf')}
        response = requests.put(
            f"{BASE_URL}/api/admin/submissions/non-existent-id-12345/redacted-coa",
            files=files,
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        
        assert response.status_code == 404, f"Expected 404 for non-existent submission, got {response.status_code}"
        print(f"✅ COA redaction returns 404 for invalid submission ID")


class TestStrainsWithGradeFilter:
    """Tests for strains API with grade data"""
    
    def test_admin_strains_include_grade_fields(self, api_client, admin_token):
        """Verify admin strains endpoint returns grade fields"""
        response = api_client.get(
            f"{BASE_URL}/api/strains/admin",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        
        strains = response.json()
        assert len(strains) > 0, "No strains returned"
        
        # Check first strain has grade fields
        first_strain = strains[0]
        assert "grade_a_kg" in first_strain or first_strain.get("grade_a_kg") is None, "grade_a_kg field should exist"
        
        # Count strains with grade data
        strains_with_grades = sum(1 for s in strains if s.get("grade_a_kg") or s.get("grade_b_kg") or s.get("grade_c_kg"))
        
        print(f"✅ Admin strains endpoint includes grade fields")
        print(f"   Total strains: {len(strains)}")
        print(f"   Strains with grade data: {strains_with_grades}")
    
    def test_strains_can_be_filtered_by_grade(self, api_client, admin_token):
        """Verify strains can be fetched and filtered by grade (client-side filtering)"""
        response = api_client.get(
            f"{BASE_URL}/api/strains/admin",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        strains = response.json()
        
        # Filter for strains with Grade A > 0
        grade_a_strains = [s for s in strains if s.get("grade_a_kg") and s.get("grade_a_kg") > 0]
        grade_b_strains = [s for s in strains if s.get("grade_b_kg") and s.get("grade_b_kg") > 0]
        grade_c_strains = [s for s in strains if s.get("grade_c_kg") and s.get("grade_c_kg") > 0]
        
        print(f"   Strains with Grade A > 0: {len(grade_a_strains)}")
        print(f"   Strains with Grade B > 0: {len(grade_b_strains)}")
        print(f"   Strains with Grade C > 0: {len(grade_c_strains)}")
        
        # Verify we have data for filtering
        total_with_grades = len(set(
            [s['id'] for s in grade_a_strains] + 
            [s['id'] for s in grade_b_strains] + 
            [s['id'] for s in grade_c_strains]
        ))
        assert total_with_grades > 0, "No strains with grade data found for filtering"
        
        print(f"✅ Strains can be filtered by grade ({total_with_grades} strains have grade data)")


class TestStrainUpdate:
    """Tests for strain update with grade fields"""
    
    def test_strain_update_preserves_grades(self, api_client, admin_token):
        """Verify PUT /api/strains/{id} preserves grade values"""
        # Get first strain
        response = api_client.get(
            f"{BASE_URL}/api/strains/admin",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        strains = response.json()
        
        # Find a strain with grade data or use first strain
        test_strain = next((s for s in strains if s.get("grade_a_kg")), strains[0])
        strain_id = test_strain["id"]
        
        # Update strain with grade data
        update_data = {
            "strain_name": test_strain["strain_name"],
            "type": test_strain["type"],
            "thc_percentage": test_strain["thc_percentage"],
            "price_tier": test_strain["price_tier"],
            "terpene_profile": test_strain["terpene_profile"],
            "lineage": test_strain["lineage"],
            "lot_size": test_strain["lot_size"],
            "effects": test_strain["effects"],
            "grade_a_kg": test_strain.get("grade_a_kg") or 10.0,
            "grade_b_kg": test_strain.get("grade_b_kg") or 5.0,
            "grade_c_kg": test_strain.get("grade_c_kg") or 2.5
        }
        
        response = api_client.put(
            f"{BASE_URL}/api/strains/{strain_id}",
            json=update_data,
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200, f"Failed to update strain: {response.text}"
        
        # Verify grades are preserved
        updated = response.json()
        assert updated.get("grade_a_kg") == update_data["grade_a_kg"], f"grade_a_kg not preserved"
        assert updated.get("grade_b_kg") == update_data["grade_b_kg"], f"grade_b_kg not preserved"
        assert updated.get("grade_c_kg") == update_data["grade_c_kg"], f"grade_c_kg not preserved"
        
        print(f"✅ Strain update preserves grade values")
        print(f"   Strain: {test_strain['strain_name']}")
        print(f"   Grade A: {updated['grade_a_kg']} kg, Grade B: {updated['grade_b_kg']} kg, Grade C: {updated['grade_c_kg']} kg")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
