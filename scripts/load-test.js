import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '5s', target: 20 },  // Ramp-up to 20 virtual users
    { duration: '10s', target: 50 }, // Burst spike to 50 virtual users
    { duration: '5s', target: 0 },   // Cool down
  ],
  thresholds: {
    http_req_duration: ['p(95)<100'], // 95% of requests should respond in <100ms
  },
};

export default function () {
  const url = 'http://localhost:3000/api/gateway/v1/loadtest';
  const params = {
    headers: {
      'x-api-key': 'qf_live_stripe_demo_key_998127391823',
      'Content-Type': 'application/json',
    },
  };

  const res = http.get(url, params);

  check(res, {
    'status is 200 or 429': (r) => r.status === 200 || r.status === 429,
    'has rate limit headers': (r) => r.headers['X-Ratelimit-Limit'] !== undefined,
  });

  sleep(0.05); // 50ms pause between request loops per VU
}
