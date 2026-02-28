# VibeTube 배포 가이드 (초보자용)

> 이 가이드는 "배포가 뭐야?" 수준부터 시작합니다.
> 차근차근 따라오세요. 모든 단계에 설명이 있습니다.

---

## 먼저! 준비물 체크리스트

시작 전에 아래 4가지가 있는지 확인하세요:

- [ ] **Supabase 계정** - https://supabase.com 에서 무료 가입
- [ ] **Vercel 계정** - https://vercel.com 에서 무료 가입 (GitHub으로 가입하면 편해요)
- [ ] **GitHub 계정** - https://github.com 에서 무료 가입
- [ ] **API 키 2개**:
  - OpenAI API Key (sk-... 로 시작하는 것)
  - YouTube Data API v3 Key (AIza... 로 시작하는 것)

전부 있으면 시작!

---

---

# PART A. 코드 준비하기

---

## A-1. 코드 다운로드하기

1. 지금 보고 있는 Figma Make 에디터 화면에서
2. 오른쪽 상단에 **"Export"** 또는 **다운로드 버튼**을 찾아주세요
3. 클릭하면 ZIP 파일이 다운로드됩니다
4. 다운로드 된 ZIP 파일을 **바탕화면**에 압축 해제하세요

> 압축 해제하면 `vibetube` 같은 폴더가 생기고, 그 안에 `package.json`, `src/`, `supabase/` 등의 파일이 들어있으면 정상이에요.

---

## A-2. GitHub에 코드 올리기

### 왜 필요해요?
Vercel이 여러분의 코드를 GitHub에서 가져와서 배포하기 때문이에요.

### 방법 1: GitHub 웹사이트에서 직접 올리기 (쉬운 방법)

1. https://github.com 접속 & 로그인
2. 오른쪽 상단 **"+"** 버튼 클릭 > **"New repository"** 클릭
3. 설정:
   - **Repository name**: `vibetube` 입력
   - **Public** 선택 (동그라미 클릭)
   - 나머지는 건드리지 마세요!
4. 초록색 **"Create repository"** 버튼 클릭
5. 새 화면이 나오면, 화면 중간의 **"uploading an existing file"** 링크를 클릭
6. 아까 압축 해제한 **폴더 안의 모든 파일과 폴더**를 드래그해서 업로드 영역에 놓기
   > 주의: 폴더 자체가 아니라, 폴더를 **열어서** 안에 있는 것들을 모두 선택해서 드래그하세요!
   > `package.json`, `src/`, `supabase/` 등이 보여야 합니다
7. 아래로 스크롤해서 초록색 **"Commit changes"** 버튼 클릭
8. 업로드가 완료되면 파일 목록이 보입니다. `package.json`이 보이면 성공!

### 방법 2: 터미널 사용 (개발자용)

터미널(Mac) 또는 명령 프롬프트(Windows)를 열고:

```bash
# 1. 압축 해제한 폴더로 이동
cd ~/Desktop/vibetube

# 2. Git 초기화
git init

# 3. 모든 파일 추가
git add .

# 4. 첫 번째 커밋
git commit -m "VibeTube initial commit"

# 5. GitHub에서 만든 repository 연결
#    아래 URL에서 [내계정] 부분만 본인 GitHub 아이디로 바꾸세요
git remote add origin https://github.com/[내계정]/vibetube.git

# 6. 코드 올리기
git branch -M main
git push -u origin main
```

> 비밀번호를 물어보면 GitHub 비밀번호가 아니라 **Personal Access Token**을 입력해야 해요.
> GitHub > Settings > Developer settings > Personal access tokens 에서 만들 수 있어요.

---

---

# PART B. Supabase 백엔드 준비하기

---

## B-1. Supabase 프로젝트 만들기

> 이미 VibeTube용 Supabase 프로젝트가 있으면 B-2로 넘어가세요!

1. https://supabase.com 접속 & 로그인
2. 대시보드에서 **"New Project"** 버튼 클릭
3. 설정:
   - **Name**: `vibetube` 입력
   - **Database Password**: 아무 비밀번호 입력 (메모해두세요!)
   - **Region**: `Northeast Asia (Tokyo)` 선택 (한국에서 가장 빠름)
4. **"Create new project"** 클릭
5. 2~3분 기다리면 프로젝트가 만들어집니다

---

## B-2. 프로젝트 정보 메모하기

이 단계 매우 중요합니다! 아래 2개를 메모장에 복사해두세요.

1. Supabase 대시보드에서 왼쪽 메뉴 맨 아래 **톱니바퀴 (Settings)** 클릭
2. **"API"** 클릭 (왼쪽 사이드바)
3. 여기서 2개를 복사:

| 이름 | 어디 있나요 | 예시 |
|------|-----------|------|
| **Project URL** | "Project URL" 항목 | `https://abcdefg.supabase.co` |
| **anon public key** | "Project API keys" > `anon` `public` | `eyJhbGci...` (매우 긴 문자열) |

> **Project URL**에서 `https://` 와 `.supabase.co`를 빼면 그게 **프로젝트 ID**예요.
> 예: `https://abcdefg.supabase.co` -> 프로젝트 ID는 `abcdefg`

메모장에 이렇게 적어두세요:
```
프로젝트 ID: abcdefg
Project URL: https://abcdefg.supabase.co
anon key: eyJhbGci.......
```

---

## B-3. Supabase CLI 설치하기

### "CLI가 뭐야?"
명령어로 Supabase를 조작하는 도구예요. 서버 코드를 배포할 때 필요합니다.

### Mac 사용자
터미널을 열고 (Spotlight에서 "터미널" 검색):
```bash
brew install supabase/tap/supabase
```

> `brew`가 없다면 먼저 Homebrew를 설치해야 해요:
> ```bash
> /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
> ```
> 설치 후 터미널을 껐다 다시 열고 위의 brew install 명령을 실행하세요.

### Windows 사용자
1. https://nodejs.org 에서 Node.js 설치 (LTS 버전 다운로드 & 설치)
2. 명령 프롬프트(cmd)를 열고:
```bash
npm install -g supabase
```

### 설치 확인
```bash
supabase --version
```
버전 번호가 나오면 성공! (예: `1.200.0`)

---

## B-4. Supabase 로그인하기

터미널에서:
```bash
supabase login
```

1. 실행하면 **브라우저가 자동으로 열립니다**
2. Supabase 사이트에서 **"Authorize"** 버튼 클릭
3. 터미널에 `Finished supabase login` 비슷한 메시지가 나오면 성공!

---

## B-5. Edge Function 배포하기 (서버 코드 올리기)

### "Edge Function이 뭐야?"
VibeTube의 서버 코드예요. 이미지를 분석하고 YouTube를 검색하는 부분이 여기서 실행됩니다.

터미널에서 **아까 압축 해제한 프로젝트 폴더로 이동**:
```bash
# Mac
cd ~/Desktop/vibetube

# Windows
cd C:\Users\[내이름]\Desktop\vibetube
```

그 다음, 프로젝트를 연결하고 배포:
```bash
# 1. 프로젝트 연결 (프로젝트 ID를 넣으세요!)
supabase link --project-ref 여기에프로젝트ID입력

# 2. 서버 코드 배포
supabase functions deploy server
```

> `supabase link`에서 Database password를 물어보면, B-1에서 설정한 비밀번호를 입력하세요.
> 모르겠으면 Enter를 눌러 건너뛰어도 됩니다.

터미널에 `Deployed Function server` 비슷한 메시지가 나오면 성공!

---

## B-6. API 키 등록하기 (Secrets 설정)

서버가 OpenAI와 YouTube를 사용하려면 API 키가 필요해요.

### 방법 1: 터미널에서 (추천)
```bash
supabase secrets set OPENAI_API_KEY="여기에OpenAI키입력"
supabase secrets set YOUTUBE_API_KEY="여기에YouTube키입력"
```

> 따옴표 안에 키를 넣으세요! 공백 없이!
> 예: `supabase secrets set OPENAI_API_KEY="sk-proj-abc123def456"`

### 방법 2: 웹 대시보드에서

1. https://supabase.com > 프로젝트 선택
2. 왼쪽 메뉴에서 **"Edge Functions"** 클릭 (번개 아이콘)
3. 상단 **"Secrets"** 탭 클릭
4. **"Add new secret"** 클릭
5. 아래 2개를 각각 추가:

| Secret name | Secret value |
|-------------|-------------|
| `OPENAI_API_KEY` | `sk-...` (본인의 OpenAI 키) |
| `YOUTUBE_API_KEY` | `AIza...` (본인의 YouTube 키) |

---

## B-7. 서버 동작 확인하기

브라우저 주소창에 아래 URL을 입력해보세요 (프로젝트 ID 교체!):

```
https://여기에프로젝트ID입력.supabase.co/functions/v1/make-server-8d7c61d9/health
```

화면에 이게 보이면 성공:
```json
{"status":"ok"}
```

> 에러가 나면?
> - `404 Not Found` -> B-5 배포를 다시 해보세요
> - `500 Error` -> B-6 API 키 설정을 다시 확인하세요

---

---

# PART C. 프론트엔드 코드 수정하기

---

## C-1. Supabase 정보 수정하기

GitHub에 올린 코드에서 **딱 1개 파일**만 수정하면 됩니다.

1. https://github.com/[내계정]/vibetube 접속
2. 파일 목록에서 `utils` 폴더 클릭
3. `supabase` 폴더 클릭
4. `info.tsx` 파일 클릭
5. 오른쪽 위 **연필 아이콘 (Edit this file)** 클릭
6. 파일 내용을 아래처럼 수정:

```tsx
/* AUTOGENERATED FILE - DO NOT EDIT CONTENTS */

export const projectId = "여기에프로젝트ID입력"
export const publicAnonKey = "여기에anon키입력"
```

> B-2에서 메모해둔 **프로젝트 ID**와 **anon public key**를 넣으세요!
>
> 예시:
> ```tsx
> export const projectId = "abcdefg"
> export const publicAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3..."
> ```

7. 오른쪽 위 **"Commit changes..."** 버튼 클릭
8. 팝업에서 다시 **"Commit changes"** 클릭

---

---

# PART D. Vercel로 프론트엔드 배포하기

---

## D-1. Vercel에 프로젝트 만들기

1. https://vercel.com 접속 & 로그인
2. 대시보드에서 **"Add New..."** 클릭 > **"Project"** 클릭
3. **"Import Git Repository"** 화면이 나옵니다
4. GitHub 계정이 연결 안 되어 있으면:
   - **"Add GitHub Account"** 클릭
   - GitHub에서 **"Authorize Vercel"** 클릭
   - 어떤 repository에 접근할지 물어보면 **"All repositories"** 선택 후 **"Install"** 클릭
5. Repository 목록에서 **`vibetube`** 를 찾아 **"Import"** 클릭

---

## D-2. 빌드 설정 확인

Import 후 설정 화면이 나옵니다:

1. **Framework Preset**: `Vite` 가 자동 선택되어 있는지 확인
   - 안 되어 있으면 드롭다운에서 `Vite` 선택
2. **Root Directory**: 비워두세요 (기본값)
3. **Build Command**: `npm run build` (기본값 그대로)
4. **Output Directory**: `dist` (기본값 그대로)
5. **Environment Variables**: 아무것도 추가하지 않아도 됩니다!

---

## D-3. 배포!

1. 파란색 **"Deploy"** 버튼 클릭!
2. 빌드 로그가 쭉 올라갑니다 (1~2분 소요)
3. **"Congratulations!"** 화면이 나오면 성공!
4. 화면에 보이는 URL이 여러분의 사이트 주소입니다!
   - 예: `https://vibetube-abc123.vercel.app`

> 빌드 실패 시?
> - 로그를 아래로 스크롤해서 빨간 글씨의 에러 메시지를 확인하세요
> - 대부분 C-1에서 `info.tsx` 수정이 잘못된 경우입니다 (따옴표 빠짐 등)

---

---

# PART E. 최종 테스트

---

## E-1. 사이트 접속

Vercel이 알려준 URL로 접속하세요.

## E-2. 테스트 순서

| 순서 | 뭘 하나요 | 기대 결과 |
|------|----------|----------|
| 1 | 사이트 접속 | VibeTube 화면이 보임, 이미지 업로드 영역 표시 |
| 2 | 아무 사진이나 업로드 | 로딩 애니메이션 후 노래 추천 결과 표시 |
| 3 | YouTube 썸네일 클릭 | 영상이 재생됨 |
| 4 | 오른쪽 상단 지구본 아이콘 클릭 | 언어 변경 메뉴 표시 |
| 5 | "다시 시도" 버튼 클릭 | 업로드 화면으로 돌아감 |

## E-3. 문제가 생겼다면?

### "이미지 업로드 후 에러가 나요"
- 브라우저에서 `F12` 키 > **Console** 탭 확인
- `OPENAI_API_KEY` 관련 에러 -> B-6 다시 확인
- `Failed to fetch` -> B-7에서 health check URL이 정상인지 확인

### "노래는 나오는데 YouTube 영상이 안 나와요"
- 브라우저 `F12` > Console에서 `youtubeDebug` 검색
- `status: "no_api_key"` -> B-6에서 YOUTUBE_API_KEY 설정 확인
- `reason: "no_candidates"` -> YouTube API 할당량 초과 (하루 10,000포인트). 내일 다시 시도
- `reason: "all_not_embeddable"` -> 해당 곡 영상이 퍼가기 금지. 다른 사진으로 시도

### "사이트 자체가 안 열려요"
- Vercel 대시보드에서 빌드 성공했는지 확인
- 빌드 실패면 로그의 에러 메시지를 읽어보세요

---

---

# (선택) 추가 설정

---

## 커스텀 도메인 연결하기

`vibetube.vercel.app` 대신 `vibetube.com` 같은 도메인을 쓰고 싶다면:

1. Vercel 대시보드 > 프로젝트 선택 > **"Settings"** 탭
2. 왼쪽 **"Domains"** 클릭
3. 원하는 도메인 입력 > **"Add"** 클릭
4. 화면에 나오는 DNS 설정 안내를 도메인 구매처(가비아, Cloudflare 등)에서 설정

## CORS 보안 강화하기

지금은 아무 사이트에서나 서버에 요청할 수 있는 상태예요.
배포 후 본인 도메인만 허용하려면:

1. `/supabase/functions/server/index.tsx` 파일을 열어서
2. `origin: "*"` 부분을 찾아서
3. `origin: "https://여러분의사이트.vercel.app"` 으로 변경
4. 다시 배포:
```bash
supabase functions deploy server
```

---

축하합니다! VibeTube가 전 세계에 공개되었습니다!
