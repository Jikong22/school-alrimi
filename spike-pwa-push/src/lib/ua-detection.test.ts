/**
 * UA detection test script.
 * Run: node --import tsx src/lib/ua-detection.test.ts
 * (or compile and run the JS output)
 */

// Inline the detection functions for Node.js testing (no module resolution issues)
function isKakaoTalk(ua: string): boolean {
  return ua.toUpperCase().includes("KAKAOTALK");
}

function isNaver(ua: string): boolean {
  return ua.toUpperCase().includes("NAVER");
}

function detectKoreanInAppBrowser(ua: string): "kakaotalk" | "naver" | null {
  if (isKakaoTalk(ua)) return "kakaotalk";
  if (isNaver(ua)) return "naver";
  return null;
}

// Real UA strings from Korean mobile browsers
const testCases: Array<{
  name: string;
  ua: string;
  expectedKakao: boolean;
  expectedNaver: boolean;
  expectedDetect: "kakaotalk" | "naver" | null;
}> = [
  {
    name: "KakaoTalk Android",
    ua: "Mozilla/5.0 (Linux; Android 13; SM-G998N Build/TP1A.220624.014; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/121.0.6167.101 Mobile Safari/537.36 KAKAOTALK",
    expectedKakao: true,
    expectedNaver: false,
    expectedDetect: "kakaotalk",
  },
  {
    name: "KakaoTalk iOS",
    ua: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_2_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/21C66 KAKAOTALK",
    expectedKakao: true,
    expectedNaver: false,
    expectedDetect: "kakaotalk",
  },
  {
    name: "Naver Android",
    ua: "Mozilla/5.0 (Linux; Android 14; SM-S928N Build/UP1A.231005.007; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/122.0.6261.119 Mobile Safari/537.36 NAVER(inapp; search; 1000; 12.0.2)",
    expectedKakao: false,
    expectedNaver: true,
    expectedDetect: "naver",
  },
  {
    name: "Naver iOS",
    ua: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/21E219 NAVER(inapp; search; 1000; 12.0.2)",
    expectedKakao: false,
    expectedNaver: true,
    expectedDetect: "naver",
  },
  {
    name: "Chrome Android",
    ua: "Mozilla/5.0 (Linux; Android 14; SM-S928N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.6261.119 Mobile Safari/537.36",
    expectedKakao: false,
    expectedNaver: false,
    expectedDetect: null,
  },
  {
    name: "Safari iOS",
    ua: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1",
    expectedKakao: false,
    expectedNaver: false,
    expectedDetect: null,
  },
  {
    name: "Samsung Internet",
    ua: "Mozilla/5.0 (Linux; Android 14; SM-S928N) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/24.0 Chrome/111.0.5563.116 Mobile Safari/537.36",
    expectedKakao: false,
    expectedNaver: false,
    expectedDetect: null,
  },
];

let passed = 0;
let failed = 0;

for (const tc of testCases) {
  const kakaoResult = isKakaoTalk(tc.ua);
  const naverResult = isNaver(tc.ua);
  const detectResult = detectKoreanInAppBrowser(tc.ua);

  const kakaoOk = kakaoResult === tc.expectedKakao;
  const naverOk = naverResult === tc.expectedNaver;
  const detectOk = detectResult === tc.expectedDetect;

  if (kakaoOk && naverOk && detectOk) {
    console.log(`✅ PASS: ${tc.name}`);
    passed++;
  } else {
    console.log(`❌ FAIL: ${tc.name}`);
    if (!kakaoOk) console.log(`   isKakaoTalk: expected ${tc.expectedKakao}, got ${kakaoResult}`);
    if (!naverOk) console.log(`   isNaver: expected ${tc.expectedNaver}, got ${naverResult}`);
    if (!detectOk) console.log(`   detect: expected ${tc.expectedDetect}, got ${detectResult}`);
    failed++;
  }
}

console.log(`\n${passed}/${testCases.length} tests passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);