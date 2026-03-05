"""
Test suite for enhanced analytics endpoints (Iteration 7)
Tests: users-report, user drill-down, engagement, global insights, CSV export
"""

import pytest
import requests
import os
import time

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://flower-marketplace-2.preview.emergentagent.com')
ADMIN_PASSWORD = "firegold2026"


class TestSetup:
    """Setup: Get admin token for all analytics tests"""
    
    @pytest.fixture(scope="class")
    def admin_token(self):
        """Login as admin and get token"""
        response = requests.post(
            f"{BASE_URL}/api/admin/login",
            json={"password": ADMIN_PASSWORD}
        )
        assert response.status_code == 200, f"Admin login failed: {response.text}"
        return response.json()["token"]


class TestUsersReport(TestSetup):
    """Test GET /api/analytics/users-report endpoint"""
    
    def test_users_report_default_sort(self, admin_token):
        """Test users report with default sort (login_count)"""
        response = requests.get(
            f"{BASE_URL}/api/analytics/users-report",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200, f"Users report failed: {response.text}"
        data = response.json()
        
        # Verify it returns a list
        assert isinstance(data, list), "Users report should return a list"
        
        # Verify each user has required fields
        if len(data) > 0:
            user = data[0]
            required_fields = ['user_id', 'name', 'company', 'email', 'country', 
                             'login_count', 'total_events', 'total_duration_seconds',
                             'last_active', 'strains_viewed', 'searches', 'coa_views', 'sample_requests']
            for field in required_fields:
                assert field in user, f"Missing field: {field}"
            print(f"✅ Users report returned {len(data)} users with all required fields")
    
    def test_users_report_sort_by_login_count(self, admin_token):
        """Test sorting by login_count"""
        response = requests.get(
            f"{BASE_URL}/api/analytics/users-report?sort_by=login_count",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        
        # Verify sort order (highest login_count first)
        if len(data) >= 2:
            assert data[0]['login_count'] >= data[1]['login_count'], "Should be sorted by login_count descending"
        print(f"✅ Sort by login_count works correctly")
    
    def test_users_report_sort_by_total_events(self, admin_token):
        """Test sorting by total_events"""
        response = requests.get(
            f"{BASE_URL}/api/analytics/users-report?sort_by=total_events",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        
        if len(data) >= 2:
            assert data[0]['total_events'] >= data[1]['total_events'], "Should be sorted by total_events descending"
        print(f"✅ Sort by total_events works correctly")
    
    def test_users_report_sort_by_last_active(self, admin_token):
        """Test sorting by last_active"""
        response = requests.get(
            f"{BASE_URL}/api/analytics/users-report?sort_by=last_active",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        print(f"✅ Sort by last_active returns {len(data)} users")
    
    def test_users_report_sort_by_strains_viewed(self, admin_token):
        """Test sorting by strains_viewed"""
        response = requests.get(
            f"{BASE_URL}/api/analytics/users-report?sort_by=strains_viewed",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        
        if len(data) >= 2:
            assert data[0]['strains_viewed'] >= data[1]['strains_viewed'], "Should be sorted by strains_viewed descending"
        print(f"✅ Sort by strains_viewed works correctly")
    
    def test_users_report_requires_admin_auth(self):
        """Test that users report requires admin authentication"""
        response = requests.get(f"{BASE_URL}/api/analytics/users-report")
        assert response.status_code == 401, "Should require authentication"
        print(f"✅ Users report properly requires admin auth (401)")


class TestUserDrillDown(TestSetup):
    """Test GET /api/analytics/user/{user_id} endpoint"""
    
    def test_user_drill_down(self, admin_token):
        """Test getting detailed analytics for a specific user"""
        # First get a user from the users report
        users_response = requests.get(
            f"{BASE_URL}/api/analytics/users-report",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert users_response.status_code == 200
        users = users_response.json()
        
        if len(users) > 0:
            user_id = users[0]['user_id']
            
            # Get drill-down for this user
            response = requests.get(
                f"{BASE_URL}/api/analytics/user/{user_id}",
                headers={"Authorization": f"Bearer {admin_token}"}
            )
            assert response.status_code == 200, f"User drill-down failed: {response.text}"
            data = response.json()
            
            # Verify structure
            assert 'user_id' in data
            assert 'user_info' in data
            assert 'total_events' in data
            assert 'total_sessions' in data
            assert 'strains_viewed' in data
            assert 'search_queries' in data
            assert 'event_breakdown' in data
            assert 'top_strains' in data
            
            print(f"✅ User drill-down returned detailed data for user {user_id[:8]}...")
            print(f"   - Total events: {data['total_events']}")
            print(f"   - Total sessions: {data['total_sessions']}")
            print(f"   - Strains viewed: {len(data['strains_viewed'])}")
        else:
            pytest.skip("No users available for drill-down test")
    
    def test_user_drill_down_invalid_id(self, admin_token):
        """Test drill-down with non-existent user returns empty/no data"""
        response = requests.get(
            f"{BASE_URL}/api/analytics/user/nonexistent-user-id-12345",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        # Should still return 200 but with empty data
        assert response.status_code == 200
        data = response.json()
        assert data['total_events'] == 0
        print(f"✅ Drill-down for non-existent user returns empty data correctly")
    
    def test_user_drill_down_requires_admin_auth(self):
        """Test that user drill-down requires admin authentication"""
        response = requests.get(f"{BASE_URL}/api/analytics/user/some-user-id")
        assert response.status_code == 401
        print(f"✅ User drill-down properly requires admin auth (401)")


class TestEngagementMetrics(TestSetup):
    """Test GET /api/analytics/engagement endpoint"""
    
    def test_engagement_metrics(self, admin_token):
        """Test engagement metrics endpoint"""
        response = requests.get(
            f"{BASE_URL}/api/analytics/engagement",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200, f"Engagement endpoint failed: {response.text}"
        data = response.json()
        
        # Verify structure
        assert 'period_days' in data
        assert 'sessions' in data
        assert 'peak_hours' in data
        assert 'daily_activity' in data
        assert 'conversion' in data
        assert 'top_navigation_flows' in data
        assert 'user_base' in data
        
        # Verify sessions structure
        sessions = data['sessions']
        assert 'total' in sessions
        assert 'avg_duration_seconds' in sessions
        assert 'max_duration_seconds' in sessions
        
        # Verify conversion structure
        conversion = data['conversion']
        assert 'total_viewers' in conversion
        assert 'sample_requesters' in conversion
        assert 'conversion_rate' in conversion
        
        print(f"✅ Engagement metrics returned all required data")
        print(f"   - Period: {data['period_days']} days")
        print(f"   - Total sessions: {sessions['total']}")
        print(f"   - Avg session: {sessions['avg_duration_seconds']} seconds")
        print(f"   - Peak hours: {len(data['peak_hours'])}")
    
    def test_engagement_with_custom_days(self, admin_token):
        """Test engagement with custom days parameter"""
        response = requests.get(
            f"{BASE_URL}/api/analytics/engagement?days=7",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert data['period_days'] == 7
        print(f"✅ Engagement with days=7 works correctly")
    
    def test_engagement_requires_admin_auth(self):
        """Test that engagement endpoint requires admin authentication"""
        response = requests.get(f"{BASE_URL}/api/analytics/engagement")
        assert response.status_code == 401
        print(f"✅ Engagement endpoint properly requires admin auth (401)")


class TestGlobalInsights(TestSetup):
    """Test GET /api/analytics/global endpoint"""
    
    def test_global_insights(self, admin_token):
        """Test global insights endpoint returns comprehensive data"""
        response = requests.get(
            f"{BASE_URL}/api/analytics/global",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200, f"Global insights failed: {response.text}"
        data = response.json()
        
        # Verify top-level sections
        assert 'totals' in data, "Missing 'totals' section"
        assert 'geographic' in data, "Missing 'geographic' section"
        assert 'demand' in data, "Missing 'demand' section"
        assert 'supply' in data, "Missing 'supply' section"
        assert 'growth' in data, "Missing 'growth' section"
        
        # Verify totals structure
        totals = data['totals']
        assert 'users' in totals
        assert 'strains' in totals
        assert 'strains_with_coa' in totals
        assert 'submissions' in totals
        assert 'sample_requests' in totals
        assert 'total_events' in totals
        
        # Verify geographic structure
        geo = data['geographic']
        assert 'users_by_country' in geo
        assert 'exports_by_country' in geo
        assert 'company_activity_by_country' in geo
        
        # Verify demand structure
        demand = data['demand']
        assert 'top_sample_requests' in demand
        assert 'type_demand' in demand
        assert 'tier_demand' in demand
        assert 'terpene_interest' in demand
        
        # Verify supply structure
        supply = data['supply']
        assert 'submission_status' in supply
        assert 'grower_types' in supply
        assert 'lot_stats' in supply
        assert 'irradiation' in supply
        
        # Verify growth structure
        growth = data['growth']
        assert 'registration_timeline' in growth
        
        print(f"✅ Global insights returned comprehensive data:")
        print(f"   - Total users: {totals['users']}")
        print(f"   - Total strains: {totals['strains']}")
        print(f"   - Total events: {totals['total_events']}")
        print(f"   - Countries with users: {len(geo['users_by_country'])}")
    
    def test_global_insights_requires_admin_auth(self):
        """Test that global insights requires admin authentication"""
        response = requests.get(f"{BASE_URL}/api/analytics/global")
        assert response.status_code == 401
        print(f"✅ Global insights properly requires admin auth (401)")


class TestUsersExportCSV(TestSetup):
    """Test GET /api/analytics/users-export/csv endpoint"""
    
    def test_users_export_csv(self, admin_token):
        """Test CSV export of user activity"""
        response = requests.get(
            f"{BASE_URL}/api/analytics/users-export/csv",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200, f"CSV export failed: {response.text}"
        
        # Verify content type
        assert 'text/csv' in response.headers.get('Content-Type', ''), "Should return CSV"
        
        # Verify content disposition
        assert 'attachment' in response.headers.get('Content-Disposition', ''), "Should be attachment"
        assert 'firegold_user_activity.csv' in response.headers.get('Content-Disposition', ''), "Should have correct filename"
        
        # Verify CSV content has headers
        content = response.text
        assert 'Name' in content or 'name' in content.lower(), "CSV should have Name column"
        assert 'Company' in content or 'company' in content.lower(), "CSV should have Company column"
        assert 'Email' in content or 'email' in content.lower(), "CSV should have Email column"
        
        lines = content.strip().split('\n')
        print(f"✅ Users CSV export works correctly")
        print(f"   - Headers: {lines[0][:80]}...")
        print(f"   - Data rows: {len(lines) - 1}")
    
    def test_users_export_csv_requires_admin_auth(self):
        """Test that CSV export requires admin authentication"""
        response = requests.get(f"{BASE_URL}/api/analytics/users-export/csv")
        assert response.status_code == 401
        print(f"✅ CSV export properly requires admin auth (401)")


class TestAnalyticsExportCSV(TestSetup):
    """Test GET /api/analytics/export/csv endpoint (general analytics export)"""
    
    def test_analytics_export_csv(self, admin_token):
        """Test general analytics CSV export"""
        response = requests.get(
            f"{BASE_URL}/api/analytics/export/csv?days=30",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200, f"Analytics CSV export failed: {response.text}"
        
        # Verify content type
        assert 'text/csv' in response.headers.get('Content-Type', ''), "Should return CSV"
        
        content = response.text
        lines = content.strip().split('\n')
        print(f"✅ Analytics CSV export works correctly")
        print(f"   - Total lines: {len(lines)}")
    
    def test_analytics_export_csv_requires_admin_auth(self):
        """Test that analytics export requires admin authentication"""
        response = requests.get(f"{BASE_URL}/api/analytics/export/csv")
        assert response.status_code == 401
        print(f"✅ Analytics CSV export properly requires admin auth (401)")


class TestDashboardEndpoint(TestSetup):
    """Test GET /api/analytics/dashboard endpoint (overview data)"""
    
    def test_analytics_dashboard(self, admin_token):
        """Test analytics dashboard endpoint"""
        response = requests.get(
            f"{BASE_URL}/api/analytics/dashboard",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200, f"Dashboard failed: {response.text}"
        data = response.json()
        
        # Verify structure
        assert 'period_days' in data
        assert 'summary' in data
        assert 'event_breakdown' in data
        assert 'top_strains' in data
        assert 'thc_interest' in data
        assert 'strain_type_interest' in data
        assert 'price_tier_interest' in data
        assert 'top_searches' in data
        assert 'company_engagement' in data
        assert 'daily_trend' in data
        
        print(f"✅ Analytics dashboard returned all sections")
        print(f"   - Period: {data['period_days']} days")
        print(f"   - Total events: {data['summary'].get('total_events', 0)}")
        print(f"   - Unique users: {data['summary'].get('unique_users', 0)}")
    
    def test_dashboard_requires_admin_auth(self):
        """Test that dashboard requires admin authentication"""
        response = requests.get(f"{BASE_URL}/api/analytics/dashboard")
        assert response.status_code == 401
        print(f"✅ Dashboard properly requires admin auth (401)")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
