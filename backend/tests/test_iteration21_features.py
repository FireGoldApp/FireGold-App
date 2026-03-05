"""
Test Iteration 21 Features:
1. Chat widget with quick-reply buttons and enhanced FAQ knowledge
2. Chat POST /api/chat returns response with graceful budget fallback
3. Admin Bot Training CRUD endpoints
4. PWA setup (manifest.json, sw.js, icons)
"""
import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "").rstrip("/")
ADMIN_PASSWORD = "firegold2026"


class TestHealthAndBasics:
    """Basic health checks"""

    def test_api_health(self):
        """Test health endpoint"""
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data.get("status") == "healthy"
        print("✅ Health check passed")


class TestChatEndpoint:
    """Test chat endpoint with enhanced system prompt"""

    def test_chat_first_message_returns_200(self):
        """Test that chat endpoint returns 200 for first message"""
        response = requests.post(f"{BASE_URL}/api/chat", json={
            "message": "How do I view the catalog?",
            "session_id": None
        })
        assert response.status_code == 200
        data = response.json()
        assert "response" in data
        assert "session_id" in data
        assert len(data["response"]) > 0
        print(f"✅ Chat first message returned 200 with response: {data['response'][:100]}...")

    def test_chat_multi_turn_same_session_returns_200(self):
        """Test that chat returns 200 for multi-turn conversation (even with budget exceeded)"""
        # First message
        session_id = str(uuid.uuid4())
        resp1 = requests.post(f"{BASE_URL}/api/chat", json={
            "message": "What is Firegold?",
            "session_id": session_id
        })
        assert resp1.status_code == 200, f"First message failed: {resp1.text}"
        data1 = resp1.json()
        returned_session = data1.get("session_id")
        print(f"First message response: {data1['response'][:100]}...")

        # Second message with same session
        resp2 = requests.post(f"{BASE_URL}/api/chat", json={
            "message": "What strains do you have?",
            "session_id": returned_session
        })
        assert resp2.status_code == 200, f"Second message failed: {resp2.text}"
        data2 = resp2.json()
        assert "response" in data2
        print(f"✅ Second message returned 200 with response: {data2['response'][:100]}...")


class TestBotTrainingCRUD:
    """Test Admin Bot Training CRUD endpoints"""

    @pytest.fixture(scope="class")
    def admin_token(self):
        """Get admin auth token"""
        response = requests.post(f"{BASE_URL}/api/admin/login", json={
            "password": ADMIN_PASSWORD
        })
        assert response.status_code == 200
        return response.json()["token"]

    def test_get_bot_training_returns_array(self, admin_token):
        """GET /api/admin/bot-training returns array"""
        response = requests.get(
            f"{BASE_URL}/api/admin/bot-training",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✅ GET /api/admin/bot-training returned array with {len(data)} entries")

    def test_create_bot_training_entry(self, admin_token):
        """POST /api/admin/bot-training creates entry with id"""
        test_entry = {
            "question": f"TEST_question_{uuid.uuid4().hex[:8]}",
            "answer": "Test answer for iteration 21",
            "category": "testing"
        }
        response = requests.post(
            f"{BASE_URL}/api/admin/bot-training",
            json=test_entry,
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "id" in data
        assert data["question"] == test_entry["question"]
        assert data["answer"] == test_entry["answer"]
        print(f"✅ POST created bot training entry with id: {data['id']}")
        return data["id"]

    def test_update_bot_training_entry(self, admin_token):
        """PUT /api/admin/bot-training/{id} updates entry"""
        # First create an entry
        create_resp = requests.post(
            f"{BASE_URL}/api/admin/bot-training",
            json={
                "question": f"TEST_update_{uuid.uuid4().hex[:8]}",
                "answer": "Original answer",
                "category": "testing"
            },
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        entry_id = create_resp.json()["id"]

        # Now update it
        update_resp = requests.put(
            f"{BASE_URL}/api/admin/bot-training/{entry_id}",
            json={
                "question": "Updated question",
                "answer": "Updated answer",
                "category": "updated"
            },
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert update_resp.status_code == 200
        print(f"✅ PUT updated bot training entry {entry_id}")

    def test_delete_bot_training_entry(self, admin_token):
        """DELETE /api/admin/bot-training/{id} deletes entry"""
        # First create an entry
        create_resp = requests.post(
            f"{BASE_URL}/api/admin/bot-training",
            json={
                "question": f"TEST_delete_{uuid.uuid4().hex[:8]}",
                "answer": "To be deleted",
                "category": "testing"
            },
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        entry_id = create_resp.json()["id"]

        # Now delete it
        delete_resp = requests.delete(
            f"{BASE_URL}/api/admin/bot-training/{entry_id}",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert delete_resp.status_code == 200
        print(f"✅ DELETE removed bot training entry {entry_id}")

        # Verify it's gone
        get_resp = requests.get(
            f"{BASE_URL}/api/admin/bot-training",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        entries = get_resp.json()
        assert not any(e["id"] == entry_id for e in entries)
        print("✅ Entry no longer exists in list")


class TestPWAStaticFiles:
    """Test PWA static files are accessible"""

    def test_manifest_json_accessible(self):
        """manifest.json is accessible at /manifest.json"""
        response = requests.get(f"{BASE_URL}/manifest.json")
        assert response.status_code == 200
        data = response.json()
        assert data.get("name") == "Firegold Marketplace"
        assert data.get("short_name") == "Firegold"
        assert "icons" in data
        print(f"✅ manifest.json accessible with name: {data.get('name')}")

    def test_service_worker_accessible(self):
        """sw.js is accessible at /sw.js"""
        response = requests.get(f"{BASE_URL}/sw.js")
        assert response.status_code == 200
        content = response.text
        assert "CACHE_NAME" in content or "serviceWorker" in content.lower() or "self.addEventListener" in content
        print("✅ sw.js accessible")

    def test_pwa_icon_192_accessible(self):
        """PWA 192x192 icon accessible"""
        response = requests.get(f"{BASE_URL}/firegold_icon_192.png")
        assert response.status_code == 200
        assert "image/png" in response.headers.get("content-type", "")
        print("✅ firegold_icon_192.png accessible")

    def test_pwa_icon_512_accessible(self):
        """PWA 512x512 icon accessible"""
        response = requests.get(f"{BASE_URL}/firegold_icon_512.png")
        assert response.status_code == 200
        assert "image/png" in response.headers.get("content-type", "")
        print("✅ firegold_icon_512.png accessible")


class TestHTMLPWAMeta:
    """Test that HTML has PWA meta tags"""

    def test_html_has_manifest_link(self):
        """HTML has manifest link"""
        response = requests.get(f"{BASE_URL}/")
        assert response.status_code == 200
        html = response.text.lower()
        assert 'rel="manifest"' in html or "rel='manifest'" in html
        print("✅ HTML has manifest link")

    def test_html_has_apple_meta_tags(self):
        """HTML has apple-mobile-web-app meta tags"""
        response = requests.get(f"{BASE_URL}/")
        assert response.status_code == 200
        html = response.text.lower()
        assert "apple-mobile-web-app-capable" in html
        print("✅ HTML has apple-mobile-web-app-capable meta tag")

    def test_html_has_theme_color(self):
        """HTML has theme-color meta tag"""
        response = requests.get(f"{BASE_URL}/")
        assert response.status_code == 200
        html = response.text.lower()
        assert 'name="theme-color"' in html or "name='theme-color'" in html
        print("✅ HTML has theme-color meta tag")
