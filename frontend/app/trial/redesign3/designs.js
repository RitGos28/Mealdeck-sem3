// Login redesign in the visual language of redesign2 (green band, white
// sheet, DM Serif Display + Inter). Static mockups: no behaviour, no backend.

const GREEN = "#163D29";
const SERIF = "'DM Serif Display', Georgia, serif";

const head = `<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=DM+Serif+Display&amp;family=Inter:wght@400;500;600;700&amp;display=swap" rel="stylesheet">
<style>body{margin:0}button,input{font:inherit}input::placeholder{color:#8A968F}
.f:focus{border-color:${GREEN}!important;box-shadow:0 0 0 3px #D6EBDC}
a:focus-visible,button:focus-visible{outline:2px solid ${GREEN};outline-offset:2px}</style>`;

const logo = `<span aria-hidden="true" style="width: 32px; height: 32px; border-radius: 10px; background: #FFFFFF; color: ${GREEN}; display: inline-flex; align-items: center; justify-content: center; font-family: ${SERIF}; font-size: 21px; line-height: 1">M</span>`;

const frame = (inner) => `
<div style="width: 390px; height: 844px; box-sizing: border-box; background: ${GREEN}; color: #14201A; font-family: Inter, system-ui, sans-serif; position: relative; overflow: hidden; display: flex; flex-direction: column">${inner}</div>`;

// Green brand band. `back` adds a back link on the left instead of the wordmark row spacing.
const band = ({ title, line, badge = "", back = "", tall = false }) => `
  <header style="padding: 18px 20px ${tall ? 40 : 28}px; color: #FFFFFF">
    <div style="display: flex; align-items: center; justify-content: space-between; min-height: 44px">
      ${back
        ? `<a href="#" style="display: inline-flex; align-items: center; gap: 6px; height: 44px; padding-right: 8px; color: #D6EBDC; text-decoration: none; font-size: 14px; font-weight: 600"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 18l-6-6 6-6"/></svg>${back}</a>`
        : `<span style="display: flex; align-items: center; gap: 10px">${logo}<span style="font-family: ${SERIF}; font-size: 24px">MealDeck</span></span>`}
      ${badge}
    </div>
    <h1 style="margin: ${tall ? 72 : 18}px 0 8px; font-family: ${SERIF}; font-size: ${tall ? 38 : 32}px; line-height: 1.1; font-weight: 400">${title}</h1>
    <p style="margin: 0; font-size: 15px; line-height: 1.45; color: #C3DDCB">${line}</p>
  </header>`;

const sheet = (inner) => `
  <main style="flex: 1; background: #FFFFFF; border-radius: 24px 24px 0 0; padding: 26px 20px 24px; display: flex; flex-direction: column">${inner}</main>`;

const field = ({ id, label, type = "text", value = "", auto, hint = "", extra = "", error = "", trailing = "" }) => `
  <div style="margin-bottom: 16px">
    <label for="${id}" style="display: block; margin-bottom: 6px; font-size: 14px; font-weight: 600; color: #14201A">${label}</label>
    <div style="position: relative">
      <input class="f" id="${id}" name="${id}" type="${type}" value="${value}" autocomplete="${auto}" ${extra} ${error ? `aria-invalid="true" aria-describedby="${id}-err"` : hint ? `aria-describedby="${id}-hint"` : ""}
        style="box-sizing: border-box; width: 100%; height: 52px; padding: 0 ${trailing ? "72px" : "14px"} 0 14px; border-radius: 14px; border: 1.5px solid ${error ? "#B42318" : "#DCE2DB"}; background: #FFFFFF; color: #14201A; font-size: 16px; outline: 0">
      ${trailing}
    </div>
    ${error ? `<p id="${id}-err" style="margin: 6px 0 0; font-size: 13px; color: #B42318">${error}</p>` : hint ? `<p id="${id}-hint" style="margin: 6px 0 0; font-size: 13px; color: #5C6B62">${hint}</p>` : ""}
  </div>`;

const show = (label = "password") => `<button type="button" aria-label="Show ${label}" style="position: absolute; right: 4px; top: 4px; height: 44px; min-width: 60px; border: 0; border-radius: 10px; background: transparent; color: #1F6B43; font-size: 14px; font-weight: 600">Show</button>`;

const primary = (label) => `<button type="submit" style="width: 100%; height: 54px; border: 0; border-radius: 999px; background: ${GREEN}; color: #FFFFFF; font-size: 16px; font-weight: 600; box-shadow: 0 12px 28px -14px rgba(20,60,38,.7)">${label}</button>`;

const textLink = (label, style = "") => `<a href="#" style="display: inline-flex; align-items: center; min-height: 44px; color: #1F6B43; font-size: 14px; font-weight: 600; text-decoration: none; ${style}">${label}</a>`;

const privacy = `<p style="margin: 0; text-align: center"><a href="/privacy" style="display: inline-flex; align-items: center; min-height: 44px; font-size: 13px; color: #5C6B62">How we use your details</a></p>`;

const divider = `<div style="height: 1px; background: #E6EAE5; margin: 4px 0"></div>`;

// Six visual boxes; one real input underneath so paste and SMS/email autofill work.
const code = (digits, { label = "6-digit code" } = {}) => `
  <div style="margin-bottom: 8px">
    <label for="code" style="display: block; margin-bottom: 8px; font-size: 14px; font-weight: 600">${label}</label>
    <div style="position: relative">
      <div aria-hidden="true" style="display: grid; grid-template-columns: repeat(6, 1fr); gap: 8px">
        ${Array.from({ length: 6 }, (_, k) => {
          const d = digits[k] || "";
          const active = k === digits.length;
          return `<div style="height: 56px; border-radius: 14px; border: 1.5px solid ${active ? GREEN : d ? "#B9CBBE" : "#DCE2DB"}; background: ${d ? "#F3F8F4" : "#FFFFFF"}; display: flex; align-items: center; justify-content: center; font-size: 24px; font-weight: 600; color: #14201A; ${active ? "box-shadow: 0 0 0 3px #D6EBDC" : ""}">${d || (active ? `<span style="width: 2px; height: 24px; background: ${GREEN}"></span>` : "")}</div>`;
        }).join("")}
      </div>
      <input id="code" name="code" value="${digits}" inputmode="numeric" autocomplete="one-time-code" pattern="\\d{6}" maxlength="6" aria-describedby="code-hint"
        style="position: absolute; inset: 0; width: 100%; height: 56px; opacity: 0; font-size: 16px; border: 0">
    </div>
    <div id="code-hint" style="display: flex; align-items: center; justify-content: space-between; margin-top: 4px">
      <span style="font-size: 13px; color: #5C6B62">Valid for 5 minutes</span>
      <button type="button" disabled style="min-height: 44px; border: 0; background: transparent; padding: 0; font-size: 14px; font-weight: 600; color: #5C6B62">Resend code in 0:42</button>
    </div>
  </div>`;

const sentTo = (email) => `
  <div style="display: flex; gap: 12px; align-items: center; padding: 12px 14px; border-radius: 14px; background: #F3F8F4; margin-bottom: 20px">
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#1F6B43" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/></svg>
    <div style="flex: 1; min-width: 0">
      <div style="font-size: 13px; color: #3E5246">Code sent to</div>
      <div style="font-size: 15px; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis">${email}</div>
    </div>
    <a href="#" style="display: inline-flex; align-items: center; min-height: 44px; font-size: 14px; font-weight: 600; color: #1F6B43; text-decoration: none">Change</a>
  </div>`;

const steps = (n, total, label) => `
  <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 18px">
    <div style="display: flex; gap: 4px" aria-hidden="true">${Array.from({ length: total }, (_, k) => `<span style="width: 28px; height: 4px; border-radius: 999px; background: ${k < n ? GREEN : "#DCE2DB"}"></span>`).join("")}</div>
    <span style="font-size: 13px; font-weight: 600; color: #5C6B62">Step ${n} of ${total} · ${label}</span>
  </div>`;

const studentLogin = ({ error = false } = {}) => frame(`
  ${band({ title: error ? "Let's try that again" : "Hungry between classes?", line: "Log in with your Bennett email to pre-order and skip the queue.", tall: !error })}
  ${sheet(`
    <form>
      ${error ? `<div role="alert" style="display: flex; gap: 10px; align-items: flex-start; padding: 12px 14px; margin-bottom: 18px; border-radius: 14px; background: #FEF3F2; color: #912018; font-size: 14px; line-height: 1.4">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true" style="flex-shrink: 0; margin-top: 1px"><circle cx="12" cy="12" r="9"/><path d="M12 7v6M12 16.5v.5"/></svg>
        <span>That email and password don't match. Check for typos, or reset your password.</span></div>` : ""}
      ${field({ id: "email", label: "Bennett email", type: "email", value: error ? "you@bennett.edu.in" : "", auto: "username", extra: 'inputmode="email" placeholder="you@bennett.edu.in" required' })}
      ${field({ id: "password", label: "Password", type: "password", value: error ? "wrongpass" : "", auto: "current-password", extra: "required", error: error ? "Incorrect password" : "", trailing: show() })}
      <div style="display: flex; justify-content: flex-end; margin: -8px 0 12px">${textLink("Forgot password?")}</div>
      ${primary("Log in")}
    </form>
    <p style="margin: 18px 0 0; text-align: center; font-size: 15px; color: #5C6B62">New here? ${textLink("Create an account")}</p>
    <div style="flex: 1"></div>
    ${divider}
    <div style="display: flex; align-items: center; justify-content: space-between">
      <a href="/privacy" style="display: inline-flex; align-items: center; min-height: 44px; font-size: 13px; color: #5C6B62">How we use your details</a>
      <a href="/vendor/login" style="display: inline-flex; align-items: center; min-height: 44px; font-size: 13px; font-weight: 600; color: #1F6B43; text-decoration: none">Vendor or admin? Log in here</a>
    </div>
  `)}`);

const signupCode = frame(`
  ${band({ back: "Log in", title: "Check your inbox", line: "We emailed you a 6-digit code to confirm your Bennett address." })}
  ${sheet(`
    ${steps(2, 3, "Verify email")}
    ${sentTo("you@bennett.edu.in")}
    <form>
      ${code("482")}
      <div style="margin-top: 12px">${primary("Verify and continue")}</div>
    </form>
    <p style="margin: 18px 0 0; font-size: 14px; line-height: 1.5; color: #5C6B62; text-align: center">Can't find it? Check spam or Promotions.<br>Next: your name, phone and a password.</p>
    <div style="flex: 1"></div>
    ${privacy}
  `)}`);

const resetPassword = frame(`
  ${band({ back: "Log in", title: "Set a new password", line: "Enter the code we emailed you, then choose a new password." })}
  ${sheet(`
    ${sentTo("you@bennett.edu.in")}
    <form>
      ${code("482913")}
      <div style="height: 8px"></div>
      ${field({ id: "new-password", label: "New password", type: "password", auto: "new-password", extra: 'minlength="6" required', hint: "At least 6 characters", trailing: show("new password") })}
      ${field({ id: "confirm-password", label: "Confirm new password", type: "password", auto: "new-password", extra: "required", trailing: show("confirmed password") })}
      ${primary("Set new password")}
    </form>
    <div style="flex: 1"></div>
    ${privacy}
  `)}`);

const staffBadge = `<span style="display: inline-flex; align-items: center; gap: 6px; height: 28px; padding: 0 12px; border-radius: 999px; border: 1px solid rgba(255,255,255,.28); color: #D6EBDC; font-size: 12px; font-weight: 600; letter-spacing: .06em; text-transform: uppercase"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="4" y="10" width="16" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></svg>Staff</span>`;

const vendorLogin = frame(`
  ${band({ badge: staffBadge, title: "Stall dashboard", line: "Log in to see today's pre-orders and keep your menu up to date.", tall: true })}
  ${sheet(`
    <form>
      ${field({ id: "email", label: "Work email", type: "email", auto: "username", extra: 'inputmode="email" required' })}
      ${field({ id: "password", label: "Password", type: "password", auto: "current-password", extra: "required", trailing: show() })}
      <div style="margin-top: 4px">${primary("Log in")}</div>
    </form>
    <p style="margin: 18px 0 0; font-size: 14px; line-height: 1.5; color: #5C6B62; text-align: center">Forgot your password or need an account?<br>Ask the MealDeck admin team.</p>
    <div style="flex: 1"></div>
    ${divider}
    <div style="display: flex; align-items: center; justify-content: space-between">
      ${textLink("← Student log in", "font-size: 13px")}
      ${textLink("Admin log in", "font-size: 13px")}
    </div>
  `)}`);

export const DESIGNS = [
  { title: "1 · Student log in", head, body: studentLogin() },
  { title: "2 · Sign up: email code", head, body: signupCode },
  { title: "3 · Forgot password", head, body: resetPassword },
  { title: "4 · Vendor log in", head, body: vendorLogin },
  { title: "5 · Wrong password", head, body: studentLogin({ error: true }) },
];
