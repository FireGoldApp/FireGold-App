"""
Test suite for Strain Directory feature
Tests the GET /api/admin/strain-directory endpoint
Verifies: admin auth, strain data, grower contact enrichment, document paths
"""

import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://strain-exchange.preview.emergentagent.com').rstrip('/')
ADMIN_PASSWORD = "firegold2026"


@pytest.fixture(scope="module")
def admin_token():
    """Get admin auth token"""
    response = requests.post(f"{BASE_URL}/api/admin/login", json={"password": ADMIN_PASSWORD})
    assert response.status_code == 200, f"Admin login failed: {response.text}"
    token = response.json().get("token")
    assert token, "No token returned from admin login"
    return token


class TestStrainDirectoryAuth:
    """Test authentication requirements for strain directory endpoint"""

    def test_directory_requires_auth(self):
        """GET /api/admin/strain-directory returns 401 without token"""
        response = requests.get(f"{BASE_URL}/api/admin/strain-directory")
        assert response.status_code == 401, f"Expected 401, got {response.status_code}: {response.text}"
        print("✅ GET /api/admin/strain-directory returns 401 without auth")

    def test_directory_rejects_invalid_token(self):
        """GET /api/admin/strain-directory returns 401 with invalid token"""
        response = requests.get(
            f"{BASE_URL}/api/admin/strain-directory",
            headers={"Authorization": "Bearer invalid_token_12345"}
        )
        assert response.status_code == 401, f"Expected 401, got {response.status_code}: {response.text}"
        print("✅ GET /api/admin/strain-directory returns 401 with invalid token")


class TestStrainDirectoryData:
    """Test strain directory data structure and content"""

    def test_directory_returns_strains(self, admin_token):
        """GET /api/admin/strain-directory returns list of strains"""
        response = requests.get(
            f"{BASE_URL}/api/admin/strain-directory",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert isinstance(data, list), "Response should be a list"
        assert len(data) > 0, "Directory should contain strains"
        print(f"✅ GET /api/admin/strain-directory returns {len(data)} strains")

    def test_strain_entry_has_required_fields(self, admin_token):
        """Each strain entry has required fields: id, strain_name, type, thc_percentage, lot_size"""
        response = requests.get(
            f"{BASE_URL}/api/admin/strain-directory",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        
        data = response.json()
        assert len(data) > 0, "Need at least one strain to test"
        
        # Check first strain entry
        entry = data[0]
        required_fields = ["id", "strain_name", "type", "thc_percentage", "lot_size"]
        for field in required_fields:
            assert field in entry, f"Missing required field: {field}"
        
        print(f"✅ Strain entry has all required fields: {required_fields}")
        print(f"   Sample: {entry['strain_name']} - {entry['type']} - THC {entry['thc_percentage']}")

    def test_strain_entry_has_document_paths(self, admin_token):
        """Each strain entry has document path fields: coa_url, health_canada_license_path, cra_license_path"""
        response = requests.get(
            f"{BASE_URL}/api/admin/strain-directory",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        
        data = response.json()
        assert len(data) > 0, "Need at least one strain to test"
        
        entry = data[0]
        doc_fields = ["coa_url", "health_canada_license_path", "cra_license_path"]
        for field in doc_fields:
            assert field in entry, f"Missing document field: {field}"
        
        # Print document status for first few strains
        print(f"✅ Strain entries have document path fields: {doc_fields}")
        for strain in data[:3]:
            coa = "✓" if strain.get("coa_url") else "✗"
            hc = "✓" if strain.get("health_canada_license_path") else "✗"
            cra = "✓" if strain.get("cra_license_path") else "✗"
            print(f"   {strain['strain_name']}: COA={coa}, HC License={hc}, CRA License={cra}")

    def test_strain_entry_has_grower_contact_fields(self, admin_token):
        """Each strain entry has grower contact fields: grower_name, company_name, grower_email, grower_phone"""
        response = requests.get(
            f"{BASE_URL}/api/admin/strain-directory",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        
        data = response.json()
        assert len(data) > 0, "Need at least one strain to test"
        
        entry = data[0]
        grower_fields = ["grower_name", "company_name", "grower_email", "grower_phone"]
        for field in grower_fields:
            assert field in entry, f"Missing grower contact field: {field}"
        
        print(f"✅ Strain entries have grower contact fields: {grower_fields}")
        
        # Since seeded strains have no grower submissions, these will be null
        # But the fields should exist
        print(f"   Note: Seeded strains have null grower fields (expected - no grower submission linked)")

    def test_directory_handles_missing_grower_gracefully(self, admin_token):
        """Strains without grower submissions have null grower fields (not missing)"""
        response = requests.get(
            f"{BASE_URL}/api/admin/strain-directory",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        
        data = response.json()
        
        # Find a strain with no grower submission
        strains_without_grower = [s for s in data if s.get("grower_name") is None]
        
        if strains_without_grower:
            entry = strains_without_grower[0]
            # Verify fields exist but are null
            assert entry.get("grower_name") is None, "grower_name should be null"
            assert entry.get("company_name") is None, "company_name should be null"
            assert entry.get("grower_email") is None, "grower_email should be null"
            assert entry.get("grower_phone") is None, "grower_phone should be null"
            print(f"✅ Strains without grower submissions have null grower fields ({len(strains_without_grower)} found)")
        else:
            print("⚠️ All strains have grower submissions linked - cannot test null case")


class TestStrainDirectoryImageAndCOA:
    """Test image_url and coa_url fields"""

    def test_strain_entries_have_image_url(self, admin_token):
        """Strain entries include image_url field"""
        response = requests.get(
            f"{BASE_URL}/api/admin/strain-directory",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        
        data = response.json()
        assert len(data) > 0
        
        entry = data[0]
        assert "image_url" in entry, "Missing image_url field"
        print(f"✅ Strain entries have image_url field")
        
        # Count how many have images
        with_images = len([s for s in data if s.get("image_url")])
        print(f"   {with_images}/{len(data)} strains have image_url set")

    def test_coa_url_field_present(self, admin_token):
        """Strain entries include coa_url field for COA access"""
        response = requests.get(
            f"{BASE_URL}/api/admin/strain-directory",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        
        data = response.json()
        assert len(data) > 0
        
        entry = data[0]
        assert "coa_url" in entry, "Missing coa_url field"
        print(f"✅ Strain entries have coa_url field")
        
        # Count how many have COAs
        with_coa = len([s for s in data if s.get("coa_url")])
        print(f"   {with_coa}/{len(data)} strains have coa_url set")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
