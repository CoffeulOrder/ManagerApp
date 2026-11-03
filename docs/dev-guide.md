# ORMO 관리자 앱 개발 가이드

코드를 처음 여는 사람이 구조를 파악하고 BE 연동 때 어디를 고쳐야 하는지 알 수 있도록 정리했습니다.

## 1. 시작하기

```bash
npm install
npm run web      # 브라우저로 확인 (expo start --web)
npx expo start   # 태블릿 실기기, 시뮬레이터
```

- Expo SDK 57 / React Native 0.86 / expo-router. **Expo가 이전 버전과 달라졌으므로** 코드를 쓰기 전에 [Expo v57 문서](https://docs.expo.dev/versions/v57.0.0/)를 먼저 확인합니다(`AGENTS.md`).
- 가로 고정(`orientation: landscape`), iPad는 전체 화면 필수, 라이트 테마만 지원합니다. 태블릿 가로 화면을 기준으로 레이아웃을 잡습니다(브라우저 확인은 1194×834 정도).
- 개발용 로그인 계정(`src/data/mock.ts`): 아이디 `beomseok` / 비밀번호 `password` / 2차 비밀번호 `1234`, 아이디 `newmill` / 비밀번호 `password` / 2차 비밀번호 `5678`.
- 개발 빌드(`__DEV__`)에서는 주문 보드에 "테스트 주문 받기" 버튼이 나옵니다.
- 타입 검사: `npx tsc --noEmit`, 린트: `npm run lint`.

## 2. 폴더 구조 (`src/`)

| 폴더 | 내용 |
|---|---|
| `app/` | 화면(expo-router). `login`, `dashboard/index`(주문), `menu`, `sales`, `settings` |
| `components/` | 모달, 배너, 상태 컨트롤 등 화면 조각. `sales/`는 일별·월별 매출 뷰 |
| `context/` | `app-context`(계정·매장·메뉴·주문 상태와 모든 액션), `device-settings`(기기별 설정), `toast` |
| `hooks/` | `use-pin-gate`(2차 비밀번호), `use-order-alert`(알림음 반복), `use-now`(타이머) 등 |
| `lib/` | 순수 함수. `order`(상태 전이, 금액, 환불), `sales`(매출 집계), `date`, `format`, `validation` |
| `constants/` | `order`(거절 사유, 취소 시간, 폐기 시간 범위), `theme`(색, 간격), `menu-category` 등 |
| `types/` | 도메인 타입(`Store`, `Order`, `OrderLine` …) |
| `data/mock.ts` | 개발용 mock 데이터 |

경로 별칭 `@/`는 `src/`입니다.

## 3. 상태 구조

- 루트 레이아웃(`app/_layout.tsx`)이 `DeviceSettingsProvider` → `AppProvider` → `ToastProvider` 순으로 감쌉니다.
- `AppProvider`는 reducer 하나로 계정, 매장, 메뉴, 주문을 관리합니다. 액션 함수(`acceptOrder`, `refundOrder` …)가 **검증을 먼저 하고** 통과하면 dispatch합니다. 실패는 `ActionResult`(`{ ok, message }`)로 돌려주고, 화면이 메시지를 보여줍니다.
- 주문 상태 전이 규칙은 `lib/order.ts`의 `ORDER_TRANSITIONS`(앞으로), `UNDO_TRANSITIONS`(실행 취소)에 있고, reducer도 허용되지 않은 전이를 무시합니다.
- 금액 계산은 항상 `lib/order.ts`의 함수를 씁니다. 주문 금액은 `netTotal`(최초 금액 − 수락 전 부분 취소 − 픽업 후 환불), 카드/쿠폰 분할은 `paymentSplit`, `refundSplit`입니다.
- 기기별 설정(알림음)은 AsyncStorage `ormo.device-settings.v1`에 저장하고, 매장·주문 데이터는 저장하지 않습니다(앱을 껐다 켜면 mock으로 초기화).

## 4. 화면 규칙

- 색과 간격은 `constants/theme.ts`의 토큰만 씁니다. 텍스트는 `ThemedText`(`type`, `color` prop).
- 아이콘은 `SymbolView`에 `{ ios, android, web }` 이름을 모두 넘깁니다.
- **모달 두 개를 이어서 띄울 때**는 첫 모달을 닫고 `MODAL_SWAP_DELAY`(300ms, `hooks/use-pin-gate`) 뒤에 다음 모달을 엽니다. 곧바로 열면 첫 모달이 사라지는 중에 두 번째 모달이 뜨지 않을 수 있습니다(iOS).
- 2차 비밀번호가 필요한 동작은 `usePinGate().requirePin(run, title?, onCancel?)`로 감싸고 `pinModal`을 화면에 렌더링합니다. 어떤 동작에 PIN을 걸지는 기획 사항이므로 바꿀 때 `FEATURE_SPEC` 2장도 같이 고칩니다.
- 되돌릴 수 없는 동작(거절, 부분 취소, 자체 폐기, 환불)은 확인 단계를 거치고 "되돌릴 수 없습니다"를 명시합니다.

## 5. 주문 동작 하나를 추가하는 순서

1. `types/index.ts`에 필요한 필드를 추가합니다.
2. `lib/order.ts`에 판정 함수와 금액 계산을 추가합니다(화면과 context에서 같이 씀).
3. `context/app-context.tsx`에 reducer 액션과 검증 함수를 추가하고 context 값, deps에 넣습니다.
4. 화면 컴포넌트를 `components/`에 만들고 `app/dashboard/index.tsx`에서 연결합니다.
5. 매출에 영향을 주면 `lib/sales.ts`(집계)와 `components/sales/*`(표시)를 같이 고칩니다.
6. `FEATURE_SPEC`(docs/admin-app-feature-spec.md)을 갱신합니다.

## 6. BE 연동 가이드

mock으로 대신하고 있는 것을 걷어내고 API로 바꿉니다. 자세한 목록은 `FEATURE_SPEC` 9장과 `ORMO_PLAN`의 "남은 기능" C장에 있습니다.

| 대상 | 위치 | 할 일 |
|---|---|---|
| 접수 10분 자동 거절 | `components/order-timeout-watcher.tsx` | 삭제하고 서버 상태를 받음 |
| 테스트 주문 받기 | `app-context.tsx` `simulateIncomingOrder` | 삭제, 실제 푸시/소켓으로 대체 |
| 자동 마감·자동 재개 | `components/store-schedule.tsx` | 서버 규칙으로 이전 |
| 로그인·PIN 검증 | `app-context.tsx` `login`, `verifySecondaryPassword` 등 | 서버 호출로 변경, 실패 횟수 제한 |
| 데이터 | `data/mock.ts` | 삭제, 초기 로딩을 API로 |

연동 순서 제안:
1. 로그인·매장 정보 로딩 → 2. 주문 목록 조회와 실시간 수신 → 3. 주문 상태 변경 API → 4. 환불·부분 취소(결제 연동) → 5. 메뉴 → 6. 매출 조회.

액션 함수가 이미 `ActionResult`를 돌려주므로, 비동기로 바꿀 때 시그니처를 `Promise<ActionResult>`로 바꾸고 화면의 호출부에서 `await` 하면 됩니다. 실행 취소와 실패 처리는 서버 응답을 기준으로 다시 정리해야 합니다.

## 7. 확인 방법과 한계

- 화면 확인은 `npm run web`으로 브라우저에서 하고, 타입은 `npx tsc --noEmit`으로 확인합니다.
- **실기기에서 확인하지 못한 것**: 알림음 재생(무음 모드 포함), 화면 꺼짐 방지, 가로 고정, iPad 전체 화면, 모달 전환 타이밍. 태블릿 실기기 테스트가 필요합니다.
- 자동화 테스트는 아직 없습니다. 금액·환불·매출 계산은 `lib/`의 순수 함수에 모여 있으므로 단위 테스트를 붙이기 좋습니다.

## 8. 문서 다시 만들기

`docs/*.md`가 원본이고 `docs/html/`은 이를 변환한 결과입니다.

```bash
node scripts/build-docs.mjs
```
