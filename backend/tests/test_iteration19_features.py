"""
Test suite for Iteration 19 Features:
1. COA badge and growing method badge on strain cards
2. Admin Messages tab with full CRUD actions
3. Public Affiliate Dashboard at /affiliate/{code}
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestStrainCOAAndGrowingMethod:
    """Tests for COA and growing method data in strains"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        # Login as test user to get strains
        login_resp = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "testuser123@test.com",
            "password": "Test123!"
        })
        assert login_resp.status_code == 200
        self.user_token = login_resp.json()["token"]
    
    def test_strains_have_coa_url(self):
        """All 32 strains should have coa_url field"""
        resp = requests.get(f"{BASE_URL}/api/strains", headers={
            "Authorization": f"Bearer {self.user_token}"
        })
        assert resp.status_code == 200
        strains = resp.json()
        assert len(strains) >= 32
        
        strains_with_coa = [s for s in strains if s.get('coa_url')]
        assert len(strains_with_coa) == len(strains), "All strains should have coa_url"
    
    def test_strains_have_growing_method(self):
        """All 32 strains should have growing_method field"""
        resp = requests.get(f"{BASE_URL}/api/strains", headers={
            "Authorization": f"Bearer {self.user_token}"
        })
        assert resp.status_code == 200
        strains = resp.json()
        
        strains_with_gm = [s for s in strains if s.get('growing_method')]
        assert len(strains_with_gm) == len(strains), "All strains should have growing_method"
    
    def test_growing_method_valid_values(self):
        """Growing method should be Indoor, Outdoor, or Greenhouse"""
        resp = requests.get(f"{BASE_URL}/api/strains", headers={
            "Authorization": f"Bearer {self.user_token}"
        })
        assert resp.status_code == 200
        strains = resp.json()
        
        valid_methods = {'Indoor', 'Outdoor', 'Greenhouse'}
        for strain in strains:
            gm = strain.get('growing_method')
            if gm:
                assert gm in valid_methods, f"Invalid growing_method: {gm}"


class TestAdminContactMessages:
    """Tests for Admin Messages tab CRUD operations"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        # Admin login
        login_resp = requests.post(f"{BASE_URL}/api/admin/login", json={
            "password": "firegold2026"
        })
        assert login_resp.status_code == 200
        self.admin_token = login_resp.json()["token"]
    
    def test_get_contact_messages(self):
        """GET /api/admin/contact-messages returns list of messages"""
        resp = requests.get(f"{BASE_URL}/api/admin/contact-messages", headers={
            "Authorization": f"Bearer {self.admin_token}"
        })
        assert resp.status_code == 200
        messages = resp.json()
        assert isinstance(messages, list)
    
    def test_get_contact_messages_requires_auth(self):
        """GET /api/admin/contact-messages requires admin auth"""
        resp = requests.get(f"{BASE_URL}/api/admin/contact-messages")
        assert resp.status_code == 401
    
    def test_mark_message_read(self):
        """PUT /api/admin/contact-messages/{id}/read marks message as read"""
        # Get an unread message
        resp = requests.get(f"{BASE_URL}/api/admin/contact-messages", headers={
            "Authorization": f"Bearer {self.admin_token}"
        })
        messages = resp.json()
        unread = [m for m in messages if m.get('status') == 'unread']
        
        if not unread:
            pytest.skip("No unread messages to test")
        
        msg_id = unread[0]['id']
        mark_resp = requests.put(
            f"{BASE_URL}/api/admin/contact-messages/{msg_id}/read",
            headers={"Authorization": f"Bearer {self.admin_token}"}
        )
        assert mark_resp.status_code == 200
        assert mark_resp.json()['message'] == 'Marked as read'
    
    def test_mark_message_read_invalid_id(self):
        """PUT /api/admin/contact-messages/{id}/read returns 404 for invalid ID"""
        resp = requests.put(
            f"{BASE_URL}/api/admin/contact-messages/invalid-id-12345/read",
            headers={"Authorization": f"Bearer {self.admin_token}"}
        )
        assert resp.status_code == 404
    
    def test_delete_message_invalid_id(self):
        """DELETE /api/admin/contact-messages/{id} returns 404 for invalid ID"""
        resp = requests.delete(
            f"{BASE_URL}/api/admin/contact-messages/invalid-id-12345",
            headers={"Authorization": f"Bearer {self.admin_token}"}
        )
        assert resp.status_code == 404
    
    def test_reply_to_message_invalid_id(self):
        """POST /api/admin/contact-messages/{id}/reply returns 404 for invalid ID"""
        resp = requests.post(
            f"{BASE_URL}/api/admin/contact-messages/invalid-id-12345/reply",
            headers={"Authorization": f"Bearer {self.admin_token}"},
            json={"reply_text": "Test reply"}
        )
        assert resp.status_code == 404
    
    def test_reply_to_message_requires_body(self):
        """POST /api/admin/contact-messages/{id}/reply requires reply_text in body"""
        # Get any message
        resp = requests.get(f"{BASE_URL}/api/admin/contact-messages", headers={
            "Authorization": f"Bearer {self.admin_token}"
        })
        messages = resp.json()
        if not messages:
            pytest.skip("No messages to test")
        
        msg_id = messages[0]['id']
        # Send without reply_text
        reply_resp = requests.post(
            f"{BASE_URL}/api/admin/contact-messages/{msg_id}/reply",
            headers={"Authorization": f"Bearer {self.admin_token}"},
            json={}
        )
        # Should fail validation - 422 Unprocessable Entity
        assert reply_resp.status_code == 422


class TestAffiliateDashboard:
    """Tests for public Affiliate Dashboard at /affiliate/{code}"""
    
    def test_affiliate_dashboard_valid_code(self):
        """GET /api/affiliate/dashboard/WARRENC returns dashboard data"""
        resp = requests.get(f"{BASE_URL}/api/affiliate/dashboard/WARRENC")
        assert resp.status_code == 200
        data = resp.json()
        
        # Check required fields
        assert 'name' in data
        assert 'referral_code' in data
        assert 'is_active' in data
        assert 'stats' in data
        assert 'recent_events' in data
        
        # Verify stats structure
        stats = data['stats']
        assert 'total_referrals' in stats
        assert 'total_conversions' in stats
        assert 'total_revenue' in stats
        assert 'total_commission' in stats
        assert 'pending_commission' in stats
        assert 'paid_commission' in stats
    
    def test_affiliate_dashboard_invalid_code(self):
        """GET /api/affiliate/dashboard/{invalid} returns 404"""
        resp = requests.get(f"{BASE_URL}/api/affiliate/dashboard/INVALIDCODE123")
        assert resp.status_code == 404
    
    def test_affiliate_dashboard_case_insensitive(self):
        """GET /api/affiliate/dashboard/{code} is case insensitive"""
        resp_upper = requests.get(f"{BASE_URL}/api/affiliate/dashboard/WARRENC")
        resp_lower = requests.get(f"{BASE_URL}/api/affiliate/dashboard/warrenc")
        
        assert resp_upper.status_code == 200
        assert resp_lower.status_code == 200
        
        # Both should return same data
        assert resp_upper.json()['referral_code'] == resp_lower.json()['referral_code']
    
    def test_affiliate_dashboard_is_public(self):
        """Affiliate dashboard does not require authentication"""
        # No auth headers
        resp = requests.get(f"{BASE_URL}/api/affiliate/dashboard/WARRENC")
        assert resp.status_code == 200


class TestMessageFilterStatuses:
    """Tests for message status filtering"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        login_resp = requests.post(f"{BASE_URL}/api/admin/login", json={
            "password": "firegold2026"
        })
        assert login_resp.status_code == 200
        self.admin_token = login_resp.json()["token"]
    
    def test_messages_have_status_field(self):
        """All messages should have a status field"""
        resp = requests.get(f"{BASE_URL}/api/admin/contact-messages", headers={
            "Authorization": f"Bearer {self.admin_token}"
        })
        assert resp.status_code == 200
        messages = resp.json()
        
        for msg in messages:
            assert 'status' in msg, "Message should have status field"
            assert msg['status'] in ['unread', 'read', 'replied'], f"Invalid status: {msg['status']}"
