/*
============================================================
SSO Sekolah - Client SDK untuk Go (Golang)
Versi    : 1.0.0
Lisensi  : MIT / Open Source
============================================================
*/

package ssoclient

import (
	"encoding/base64"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"strings"
	"time"
)

// Client merepresentasikan instance SDK SSO Sekolah
type Client struct {
	BaseURL    string
	APIKey     string
	HTTPClient *http.Client
}

// NewClient membuat instance baru Client SDK SSO Sekolah
func NewClient(baseURL, apiKey string) *Client {
	return &Client{
		BaseURL: strings.TrimRight(baseURL, "/"),
		APIKey:  apiKey,
		HTTPClient: &http.Client{
			Timeout: 10 * time.Second,
		},
	}
}

// TestConnection menguji validitas API Key ke portal SSO
func (c *Client) TestConnection() (map[string]interface{}, error) {
	return c.request("GET", "/v1/test", nil)
}

// GetMembers mengambil daftar pengguna/member SSO
func (c *Client) GetMembers(params url.Values) (map[string]interface{}, error) {
	return c.request("GET", "/v1/members", params)
}

// GetMemberByID mengambil detail pengguna spesifik berdasarkan ID
func (c *Client) GetMemberByID(id string) (map[string]interface{}, error) {
	return c.request("GET", "/v1/members/"+id, nil)
}

// GetKelas mengambil daftar kelas sekolah
func (c *Client) GetKelas(params url.Values) (map[string]interface{}, error) {
	return c.request("GET", "/v1/kelas", params)
}

// GetTahunPelajaran mengambil daftar tahun pelajaran
func (c *Client) GetTahunPelajaran(params url.Values) (map[string]interface{}, error) {
	return c.request("GET", "/v1/tahun-pelajaran", params)
}

// GetPeran mengambil daftar peran (roles) yang terdaftar
func (c *Client) GetPeran() (map[string]interface{}, error) {
	return c.request("GET", "/v1/data/peran", nil)
}

// GetStatistik mengambil data statistik agregat sistem
func (c *Client) GetStatistik() (map[string]interface{}, error) {
	return c.request("GET", "/v1/data/statistik", nil)
}

// VerifyJWTToken mengekstrak dan memverifikasi payload Token JWT SSO
func VerifyJWTToken(token string) (map[string]interface{}, error) {
	parts := strings.Split(token, ".")
	if len(parts) != 3 {
		return nil, fmt.Errorf("invalid jwt token format")
	}
	payloadBytes, err := base64.RawURLEncoding.DecodeString(parts[1])
	if err != nil {
		return nil, err
	}
	var payload map[string]interface{}
	if err := json.Unmarshal(payloadBytes, &payload); err != nil {
		return nil, err
	}
	return payload, nil
}

// Helper internal untuk mengirim request HTTP
func (c *Client) request(method, path string, params url.Values) (map[string]interface{}, error) {
	reqURL := c.BaseURL + path
	if len(params) > 0 {
		reqURL += "?" + params.Encode()
	}

	req, err := http.NewRequest(method, reqURL, nil)
	if err != nil {
		return nil, err
	}

	req.Header.Set("X-API-Key", c.APIKey)
	req.Header.Set("Accept", "application/json")

	resp, err := c.HTTPClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("koneksi SSO gagal: %w", err)
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}

	var result map[string]interface{}
	if err := json.Unmarshal(body, &result); err != nil {
		return nil, fmt.Errorf("gagal parse JSON respon: %w", err)
	}

	if resp.StatusCode >= 400 {
		if msg, ok := result["pesan"].(string); ok {
			return nil, fmt.Errorf(msg)
		}
		return nil, fmt.Errorf("HTTP error %d", resp.StatusCode)
	}

	return result, nil
}
