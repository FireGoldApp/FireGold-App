import requests
import sys
from datetime import datetime
import json

class FiregoldAPITester:
    def __init__(self, base_url="https://reload-engine.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.tests_run = 0
        self.tests_passed = 0
        self.errors = []

    def log_test_result(self, test_name, success, details=None):
        """Log test result with details"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {test_name} - PASSED")
        else:
            print(f"❌ {test_name} - FAILED")
            if details:
                print(f"   Details: {details}")
                self.errors.append(f"{test_name}: {details}")

    def test_health_check(self):
        """Test health check endpoint"""
        try:
            response = requests.get(f"{self.api_url}/health", timeout=10)
            success = response.status_code == 200
            data = response.json() if success else {}
            self.log_test_result("Health Check", success, 
                               f"Status: {response.status_code}, Data: {data}")
            return success, data
        except Exception as e:
            self.log_test_result("Health Check", False, str(e))
            return False, {}

    def test_root_endpoint(self):
        """Test root API endpoint"""
        try:
            response = requests.get(f"{self.api_url}/", timeout=10)
            success = response.status_code == 200
            data = response.json() if success else {}
            self.log_test_result("Root Endpoint", success,
                               f"Status: {response.status_code}, Message: {data.get('message', 'N/A')}")
            return success, data
        except Exception as e:
            self.log_test_result("Root Endpoint", False, str(e))
            return False, {}

    def test_get_all_strains(self):
        """Test getting all strains without filters"""
        try:
            response = requests.get(f"{self.api_url}/strains", timeout=15)
            success = response.status_code == 200
            data = response.json() if success else []
            
            strain_count = len(data) if success else 0
            self.log_test_result("Get All Strains", success,
                               f"Status: {response.status_code}, Count: {strain_count}")
            
            if success and strain_count > 0:
                # Check first strain structure
                first_strain = data[0]
                required_fields = ['id', 'strain_name', 'type', 'thc_percentage', 'price_tier', 
                                 'terpene_profile', 'lineage', 'lot_size', 'effects']
                missing_fields = [f for f in required_fields if f not in first_strain]
                
                if missing_fields:
                    self.log_test_result("Strain Data Structure", False, f"Missing fields: {missing_fields}")
                else:
                    self.log_test_result("Strain Data Structure", True, "All required fields present")
            
            return success, data
        except Exception as e:
            self.log_test_result("Get All Strains", False, str(e))
            return False, []

    def test_strain_filters(self):
        """Test strain filtering functionality"""
        test_cases = [
            {"name": "Filter by Type - Indica", "params": {"type_filter": "Indica"}},
            {"name": "Filter by Type - Sativa", "params": {"type_filter": "Sativa"}}, 
            {"name": "Filter by Type - Hybrid", "params": {"type_filter": "Hybrid"}},
            {"name": "Filter by Price - $", "params": {"price_tier": "$"}},
            {"name": "Filter by Price - $$", "params": {"price_tier": "$$"}},
            {"name": "Filter by Price - $$$", "params": {"price_tier": "$$$"}},
            {"name": "Filter by THC 25%+", "params": {"min_thc": 25}},
            {"name": "Filter by THC 30%+", "params": {"min_thc": 30}},
            {"name": "Search by Name", "params": {"search": "Jealousy"}},
        ]
        
        for test_case in test_cases:
            try:
                response = requests.get(f"{self.api_url}/strains", params=test_case["params"], timeout=10)
                success = response.status_code == 200
                data = response.json() if success else []
                count = len(data) if success else 0
                
                self.log_test_result(test_case["name"], success, f"Results: {count} strains")
            except Exception as e:
                self.log_test_result(test_case["name"], False, str(e))

    def test_get_single_strain(self, strain_id=None):
        """Test getting a single strain by ID"""
        if not strain_id:
            # First get a strain ID
            try:
                response = requests.get(f"{self.api_url}/strains", timeout=10)
                if response.status_code == 200:
                    strains = response.json()
                    if strains:
                        strain_id = strains[0]['id']
                    else:
                        self.log_test_result("Get Single Strain", False, "No strains available")
                        return False, {}
                else:
                    self.log_test_result("Get Single Strain", False, "Could not fetch strain list")
                    return False, {}
            except Exception as e:
                self.log_test_result("Get Single Strain", False, f"Error fetching strain list: {e}")
                return False, {}

        try:
            response = requests.get(f"{self.api_url}/strains/{strain_id}", timeout=10)
            success = response.status_code == 200
            data = response.json() if success else {}
            
            self.log_test_result("Get Single Strain", success,
                               f"Status: {response.status_code}, Strain: {data.get('strain_name', 'N/A')}")
            return success, data
        except Exception as e:
            self.log_test_result("Get Single Strain", False, str(e))
            return False, {}

    def test_create_inquiry(self):
        """Test creating a buyer inquiry"""
        # First get a strain ID for the inquiry
        try:
            strains_response = requests.get(f"{self.api_url}/strains", timeout=10)
            if strains_response.status_code != 200:
                self.log_test_result("Create Inquiry", False, "Could not fetch strains for inquiry")
                return False, {}
            
            strains = strains_response.json()
            if not strains:
                self.log_test_result("Create Inquiry", False, "No strains available for inquiry")
                return False, {}
            
            strain_id = strains[0]['id']
            
            # Create test inquiry
            inquiry_data = {
                "company_name": "Test Cannabis Co.",
                "contact_name": "John Tester",
                "email": "john@testcannabis.com",
                "phone": "+1-555-0123",
                "strain_ids": [strain_id],
                "message": "Interested in bulk pricing for wholesale distribution."
            }
            
            response = requests.post(f"{self.api_url}/inquiries", json=inquiry_data, timeout=10)
            success = response.status_code == 200
            data = response.json() if success else {}
            
            self.log_test_result("Create Inquiry", success,
                               f"Status: {response.status_code}, ID: {data.get('id', 'N/A')}")
            return success, data
        except Exception as e:
            self.log_test_result("Create Inquiry", False, str(e))
            return False, {}

    def test_get_inquiries(self):
        """Test getting all inquiries"""
        try:
            response = requests.get(f"{self.api_url}/inquiries", timeout=10)
            success = response.status_code == 200
            data = response.json() if success else []
            count = len(data) if success else 0
            
            self.log_test_result("Get Inquiries", success,
                               f"Status: {response.status_code}, Count: {count}")
            return success, data
        except Exception as e:
            self.log_test_result("Get Inquiries", False, str(e))
            return False, []

    def test_stats_endpoint(self):
        """Test catalog statistics endpoint"""
        try:
            response = requests.get(f"{self.api_url}/stats", timeout=10)
            success = response.status_code == 200
            data = response.json() if success else {}
            
            if success:
                stats_info = f"Strains: {data.get('total_strains', 'N/A')}, Inquiries: {data.get('total_inquiries', 'N/A')}"
            else:
                stats_info = f"Status: {response.status_code}"
                
            self.log_test_result("Get Stats", success, stats_info)
            return success, data
        except Exception as e:
            self.log_test_result("Get Stats", False, str(e))
            return False, {}

    def test_seed_endpoint(self):
        """Test database seeding endpoint"""
        try:
            response = requests.post(f"{self.api_url}/seed", timeout=15)
            success = response.status_code == 200
            data = response.json() if success else {}
            
            self.log_test_result("Database Seed", success,
                               f"Status: {response.status_code}, Message: {data.get('message', 'N/A')}")
            return success, data
        except Exception as e:
            self.log_test_result("Database Seed", False, str(e))
            return False, {}

    def run_all_tests(self):
        """Run all backend API tests"""
        print(f"🧪 Starting Firegold Cannabis Catalog API Tests")
        print(f"📡 Testing against: {self.base_url}")
        print("=" * 60)

        # Test basic connectivity
        self.test_health_check()
        self.test_root_endpoint()
        
        # Test database seeding
        self.test_seed_endpoint()
        
        # Test strain endpoints
        success, strains = self.test_get_all_strains()
        
        if success and strains:
            self.test_strain_filters()
            self.test_get_single_strain(strains[0]['id'])
        
        # Test inquiry endpoints
        self.test_create_inquiry()
        self.test_get_inquiries()
        
        # Test stats
        self.test_stats_endpoint()
        
        # Print summary
        print("=" * 60)
        print(f"🏁 Test Summary:")
        print(f"   Total Tests: {self.tests_run}")
        print(f"   Passed: {self.tests_passed}")
        print(f"   Failed: {self.tests_run - self.tests_passed}")
        print(f"   Success Rate: {(self.tests_passed/self.tests_run)*100:.1f}%")
        
        if self.errors:
            print(f"\n❌ Failed Tests:")
            for error in self.errors:
                print(f"   • {error}")
        
        return self.tests_passed == self.tests_run

def main():
    tester = FiregoldAPITester()
    success = tester.run_all_tests()
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())