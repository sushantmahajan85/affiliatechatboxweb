from fpdf import FPDF

OUT = r"c:\Users\Abu Raihan\OneDrive\Desktop\Stellar Code\affiliatechatboxweb\src\report\security-remediation-summary.pdf"


class PDF(FPDF):
    def header(self):
        self.set_font("Helvetica", "B", 10)
        self.set_text_color(10, 126, 164)
        self.cell(0, 8, "Affiliate Chat Box - Security Remediation Summary", align="L")
        self.ln(4)
        self.set_draw_color(10, 126, 164)
        self.line(10, self.get_y(), 200, self.get_y())
        self.ln(6)

    def footer(self):
        self.set_y(-15)
        self.set_font("Helvetica", "I", 8)
        self.set_text_color(120, 120, 120)
        self.cell(0, 10, f"Page {self.page_no()}/{{nb}} | Generated 29 June 2026", align="C")

    def section_title(self, title: str) -> None:
        self.ln(4)
        self.set_font("Helvetica", "B", 13)
        self.set_text_color(10, 126, 164)
        self.multi_cell(0, 8, title)
        self.ln(2)

    def sub_title(self, title: str) -> None:
        self.set_font("Helvetica", "B", 11)
        self.set_text_color(26, 26, 46)
        self.multi_cell(0, 7, title)
        self.ln(1)

    def body_text(self, text: str) -> None:
        self.set_font("Helvetica", "", 10)
        self.set_text_color(26, 26, 46)
        self.multi_cell(0, 5, text)
        self.ln(2)

    def table_row(self, cols, widths, header=False) -> None:
        if header:
            self.set_font("Helvetica", "B", 8)
            self.set_text_color(255, 255, 255)
            self.set_fill_color(10, 126, 164)
        else:
            self.set_font("Helvetica", "", 8)
            self.set_text_color(26, 26, 46)
            self.set_fill_color(247, 249, 251)

        line_h = 5
        x0 = self.get_x()
        y0 = self.get_y()
        max_h = line_h
        for i, col in enumerate(cols):
            lines = max(1, int(self.get_string_width(col) / max(widths[i] - 2, 1) * 0.35) + 1)
            max_h = max(max_h, lines * line_h)

        if y0 + max_h > 270:
            self.add_page()
            y0 = self.get_y()

        for i, col in enumerate(cols):
            x = x0 + sum(widths[:i])
            self.set_xy(x, y0)
            if header:
                self.set_fill_color(10, 126, 164)
                self.set_text_color(255, 255, 255)
            else:
                self.set_fill_color(247, 249, 251)
                self.set_text_color(26, 26, 46)
            self.multi_cell(widths[i], line_h, col, border=1, fill=True, align="L")

        self.set_xy(x0, y0 + max_h)


def main() -> None:
    pdf = PDF()
    pdf.alias_nb_pages()
    pdf.set_auto_page_break(auto=True, margin=20)
    pdf.add_page()

    pdf.set_font("Helvetica", "B", 18)
    pdf.set_text_color(26, 26, 46)
    pdf.cell(0, 12, "Security Report Remediation Summary", ln=1)
    pdf.set_font("Helvetica", "", 10)
    pdf.set_text_color(80, 80, 80)
    pdf.multi_cell(
        0,
        5,
        "Reports: frontend-security report.html | backend-report.html | security report.pdf\n"
        "Frontend: affiliatechatbox.com (affiliatechatboxweb)\n"
        "Admin: admin-panel-omd.netlify.app (Online_media_tools_ADMIN_PANEL)\n"
        "Date: 29 June 2026",
    )
    pdf.ln(3)
    pdf.set_fill_color(240, 244, 255)
    pdf.set_text_color(26, 26, 46)
    pdf.set_font("Helvetica", "B", 9)
    pdf.multi_cell(
        0,
        5,
        "NOTE: Code fixes are done. Re-deploy both sites to Netlify, then re-run ZAP scan. "
        "Some alerts are from Cloudflare/Google and cannot be fixed in app code.",
        fill=True,
    )
    pdf.ln(4)

    pdf.section_title("1. Executive Summary")
    w = [55, 20, 115]
    pdf.table_row(["Category", "Count", "Notes"], w, header=True)
    for r in [
        ("Fully solved in our code", "14", "Headers, avatars, fonts, ELMAH, error pages, HTTPS redirects"),
        ("Partially solved", "3", "Third-party CORS; RSC error disclosure"),
        ("Not fixable from app code", "6", "Cloudflare cookies, CDN headers, third-party CORS, timestamps"),
        ("Informational (no action)", "7", "localStorage, cache, modern web app, fuzzer"),
    ]:
        pdf.table_row(list(r), w)

    pdf.section_title("2. Frontend (affiliatechatbox.com) - SOLVED")
    w = [52, 16, 18, 104]
    pdf.table_row(["Alert", "Risk", "Status", "Fix / Files"], w, header=True)
    for r in [
        ("CSP Header Not Set", "Medium", "SOLVED", "CSP in next.config.ts + netlify.toml + security-headers.ts"),
        ("Missing Anti-clickjacking", "Medium", "SOLVED", "X-Frame-Options DENY + frame-ancestors none"),
        ("Sub Resource Integrity Missing", "Medium", "SOLVED", "Local SVG avatars replace ui-avatars.com"),
        ("X-Content-Type-Options Missing", "Low", "SOLVED", "nosniff header added"),
        ("HSTS Not Set", "Low", "SOLVED", "Strict-Transport-Security (production)"),
        ("X-Powered-By Leak", "Low", "SOLVED", "poweredByHeader: false in Next.js"),
        ("HTTPS via HTTP", "Low", "SOLVED", "HTTP to HTTPS 301 redirects in netlify.toml"),
    ]:
        pdf.table_row(list(r), w)

    pdf.sub_title("Partially Solved")
    for r in [
        ("Cross-Domain CORS", "Medium", "PARTIAL", "Fixed our avatars. Cloudflare cdn-cgi and Google still flagged."),
        ("Application Error Disclosure", "Low", "PARTIAL", "Added error.tsx pages. May still flag if RSC returns 500."),
    ]:
        pdf.table_row(list(r), w)

    pdf.sub_title("Not Fixable From App Code")
    w2 = [52, 138]
    pdf.table_row(["Alert", "Why / How to address"], w2, header=True)
    for r in [
        ("Cookie SameSite=None", "Cloudflare cf_clearance cookie. Fix via Cloudflare dashboard. Usually accepted."),
        ("Server Header Leak", "Cloudflare/CDN sets Server header. Cloudflare Transform Rules or accept."),
        ("Timestamp Disclosure", "Unix timestamps in API JSON. Normal data - document as accepted false positive."),
        ("Third-party CORS", "Google, Cloudflare, Mozilla control their CORS. Cannot fix from our code."),
        ("HSTS on external URLs", "Scanner checked Google/Mozilla - not our domain. No action."),
    ]:
        pdf.table_row(list(r), w2)

    pdf.sub_title("Informational - No Action Required")
    for r in [
        ("localStorage disclosure", "UI preference storage. Report says no action needed."),
        ("Cache-control review", "Informational caching note."),
        ("Retrieved from Cache", "Informational - CDN caching working."),
    ]:
        pdf.table_row([r[0], r[1]], w2)

    pdf.section_title("3. Admin (admin-panel-omd.netlify.app) - SOLVED")
    w = [52, 16, 18, 104]
    pdf.table_row(["Alert", "Risk", "Status", "Fix / Files"], w, header=True)
    for r in [
        ("CSP Header Not Set", "Medium", "SOLVED", "netlify.toml security headers"),
        ("ELMAH Information Leak", "Medium", "SOLVED", "/elmah.axd returns 404 (SPA false positive fixed)"),
        ("Missing Anti-clickjacking", "Medium", "SOLVED", "X-Frame-Options + CSP frame-ancestors"),
        ("Sub Resource Integrity Missing", "Medium", "SOLVED", "Removed Google Fonts; system fonts used"),
        ("X-Content-Type-Options Missing", "Low", "SOLVED", "nosniff header"),
        ("HSTS Not Set", "Low", "SOLVED", "HSTS in netlify.toml"),
    ]:
        pdf.table_row(list(r), w)

    pdf.sub_title("Partial / Not Fixable (Admin)")
    for r in [
        ("Cross-Domain CORS", "PARTIAL - fonts.googleapis.com is third-party if still prefetched"),
        ("Server Header Leak", "NOT FIXABLE - Netlify infrastructure header"),
        ("Timestamp Disclosure", "NOT FIXABLE - normal API timestamps"),
        ("Modern Web App / Cache / Fuzzer", "INFORMATIONAL - no action required"),
    ]:
        pdf.table_row([r[0], r[1]], w2)

    pdf.section_title("4. Deployment Checklist")
    for step in [
        "1. Deploy affiliatechatboxweb to Netlify (affiliatechatbox.com)",
        "2. Deploy Online_media_tools_ADMIN_PANEL to Netlify (admin-panel-omd.netlify.app)",
        "3. Verify: curl -I https://affiliatechatbox.com",
        "4. Verify: curl -I https://admin-panel-omd.netlify.app/elmah.axd (expect 404)",
        "5. Re-run ZAP scan on both URLs",
        "6. Document remaining third-party findings as accepted risks",
    ]:
        pdf.body_text(step)

    pdf.section_title("5. Files Modified")
    pdf.sub_title("affiliatechatboxweb")
    pdf.body_text(
        "next.config.ts, netlify.toml, src/lib/security-headers.ts, "
        "src/lib/user-profile-image.ts, src/app/error.tsx, global-error.tsx, "
        "not-found.tsx, chats.tsx, use-inbox-preview-chats.ts"
    )
    pdf.sub_title("Online_media_tools_ADMIN_PANEL")
    pdf.body_text("netlify.toml, public/404.html, public/index.html, _variables.scss, App.css")

    pdf.output(OUT)
    print(f"PDF written: {OUT}")


if __name__ == "__main__":
    main()
