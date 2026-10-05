function escapeXml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function downloadPngFromSvg(svg, filename, width, height) {
  return new Promise((resolve, reject) => {
    const blob = new Blob([svg], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const img = new Image();

    img.onload = () => {
      const scale = 2;
      const canvas = document.createElement("canvas");
      canvas.width = width * scale;
      canvas.height = height * scale;

      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);

      canvas.toBlob((png) => {
        if (!png) {
          reject(new Error("Could not create PNG confirmation."));
          return;
        }

        const downloadUrl = URL.createObjectURL(png);
        const a = document.createElement("a");
        a.href = downloadUrl;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        a.remove();

        setTimeout(() => URL.revokeObjectURL(downloadUrl), 1000);
        resolve();
      }, "image/png");
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Could not create confirmation image."));
    };

    img.src = url;
  });
}

export async function downloadIndividualConfirmation(booking = {}) {
  const width = 1200;
  const height = 760;
  const name = `${booking.title || ""} ${booking.name || ""}`.trim();
  const token = booking.token || booking.reference || "";

  const svg = `
  <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
    <rect width="1200" height="760" fill="#f4f7fb"/>
    <rect x="55" y="45" width="1090" height="670" rx="28" fill="#fff" stroke="#dbe4ef" stroke-width="2"/>

    <rect x="55" y="45" width="1090" height="135" rx="28" fill="#244774"/>
    <rect x="55" y="155" width="1090" height="25" fill="#244774"/>

    <text x="90" y="102" fill="#fff" font-family="Arial, Helvetica, sans-serif" font-size="32" font-weight="700">EMBASSY APPOINTMENT</text>
    <text x="90" y="140" fill="#e8eef7" font-family="Arial, Helvetica, sans-serif" font-size="20">Appointment Confirmation</text>

    <circle cx="1065" cy="112" r="30" fill="#edf4fb"/>
    <path d="M1049 112 l10 11 l22 -26" fill="none" stroke="#16834b" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>

    <text x="90" y="230" fill="#172033" font-family="Arial, Helvetica, sans-serif" font-size="30" font-weight="700">Booking Confirmed</text>
    <text x="90" y="265" fill="#71829b" font-family="Arial, Helvetica, sans-serif" font-size="18">Please bring this confirmation on your appointment day.</text>

    <!-- Reference number is deliberately separated from the detail rows so it cannot be hidden/overlapped. -->
    <rect x="735" y="205" width="375" height="92" rx="18" fill="#edf4fd" stroke="#d8e5f4"/>
    <text x="765" y="238" fill="#244774" font-family="Arial, Helvetica, sans-serif" font-size="16" font-weight="700">REFERENCE NUMBER</text>
    <text x="765" y="275" fill="#172033" font-family="Arial, Helvetica, sans-serif" font-size="27" font-weight="700">${escapeXml(token)}</text>

    <text x="90" y="325" fill="#71829b" font-family="Arial, Helvetica, sans-serif" font-size="16">SERVICE</text>
    <text x="300" y="325" fill="#172033" font-family="Arial, Helvetica, sans-serif" font-size="18" font-weight="700">Passport</text>

    <text x="90" y="365" fill="#71829b" font-family="Arial, Helvetica, sans-serif" font-size="16">APPLICANT NAME</text>
    <text x="300" y="365" fill="#172033" font-family="Arial, Helvetica, sans-serif" font-size="18" font-weight="700">${escapeXml(name)}</text>

    <text x="90" y="405" fill="#71829b" font-family="Arial, Helvetica, sans-serif" font-size="16">APPOINTMENT DATE</text>
    <text x="300" y="405" fill="#172033" font-family="Arial, Helvetica, sans-serif" font-size="18" font-weight="700">${escapeXml(booking.date || "")}</text>

    <text x="90" y="445" fill="#71829b" font-family="Arial, Helvetica, sans-serif" font-size="16">APPOINTMENT TIME</text>
    <text x="300" y="445" fill="#172033" font-family="Arial, Helvetica, sans-serif" font-size="18" font-weight="700">${escapeXml(booking.slot || "")}</text>

    <text x="90" y="485" fill="#71829b" font-family="Arial, Helvetica, sans-serif" font-size="16">EMAIL</text>
    <text x="300" y="485" fill="#172033" font-family="Arial, Helvetica, sans-serif" font-size="18" font-weight="700">${escapeXml(booking.email || "")}</text>

    <text x="90" y="525" fill="#71829b" font-family="Arial, Helvetica, sans-serif" font-size="16">PHONE</text>
    <text x="300" y="525" fill="#172033" font-family="Arial, Helvetica, sans-serif" font-size="18" font-weight="700">${escapeXml(booking.phone || "")}</text>

    <text x="90" y="635" fill="#dc2626" font-family="Arial, Helvetica, sans-serif" font-size="17" font-weight="700">Please bring this confirmation together with your required original documents.</text>
    <text x="90" y="670" fill="#94a3b8" font-family="Arial, Helvetica, sans-serif" font-size="14">Embassy Appointment System</text>
  </svg>`;

  const safeName = String(booking.name || "appointment")
    .trim()
    .replace(/[^a-z0-9-_]+/gi, "-")
    .replace(/^-+|-+$/g, "");

  await downloadPngFromSvg(
    svg,
    `Appointment-Confirmation-${safeName || "booking"}.png`,
    width,
    height
  );
}

// Backward-compatible name for pages that use the generic helper.
export async function downloadAppointmentConfirmation(data = {}) {
  return downloadIndividualConfirmation(data);
}

export async function downloadFamilyConfirmation({ email = "", date = "", members = [], tokens = [] } = {}) {
  const width = 1200;
  const rowHeight = 92;
  const rows = Array.isArray(members) ? members : [];
  const height = 560 + Math.max(1, rows.length) * rowHeight;

  const memberRows = rows.length
    ? rows.map((member, index) => {
        const y = 335 + index * rowHeight;
        const memberToken = tokens?.[index] || member?.token || "";
        return `
          <rect x="80" y="${y}" width="1040" height="70" rx="12" fill="#f8fafc" stroke="#d9e2ec"/>
          <text x="105" y="${y + 30}" fill="#172033" font-family="Arial, Helvetica, sans-serif" font-size="18" font-weight="700">${escapeXml(member?.name || `Member ${index + 1}`)}</text>
          <text x="105" y="${y + 53}" fill="#64748b" font-family="Arial, Helvetica, sans-serif" font-size="15">${escapeXml(member?.slot || "—")}</text>
          <text x="820" y="${y + 28}" fill="#71829b" font-family="Arial, Helvetica, sans-serif" font-size="13" font-weight="700">REFERENCE NUMBER</text>
          <text x="820" y="${y + 53}" fill="#244774" font-family="Arial, Helvetica, sans-serif" font-size="18" font-weight="700">${escapeXml(memberToken)}</text>
        `;
      }).join("")
    : `<text x="80" y="370" fill="#64748b" font-family="Arial, Helvetica, sans-serif" font-size="17">No family members found.</text>`;

  const svg = `
  <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
    <rect width="${width}" height="${height}" fill="#f4f7fb"/>
    <rect x="55" y="45" width="1090" height="${height - 90}" rx="28" fill="#fff" stroke="#dbe4ef" stroke-width="2"/>
    <rect x="55" y="45" width="1090" height="135" rx="28" fill="#244774"/>
    <rect x="55" y="155" width="1090" height="25" fill="#244774"/>
    <text x="90" y="102" fill="#fff" font-family="Arial, Helvetica, sans-serif" font-size="32" font-weight="700">EMBASSY APPOINTMENT</text>
    <text x="90" y="140" fill="#e8eef7" font-family="Arial, Helvetica, sans-serif" font-size="20">Appointment Confirmation</text>
    <circle cx="1065" cy="112" r="30" fill="#edf4fb"/>
    <path d="M1049 112 l10 11 l22 -26" fill="none" stroke="#16834b" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>
    <text x="90" y="230" fill="#172033" font-family="Arial, Helvetica, sans-serif" font-size="30" font-weight="700">Booking Confirmed</text>
    <text x="90" y="265" fill="#71829b" font-family="Arial, Helvetica, sans-serif" font-size="18">Family appointment confirmation</text>
    <text x="90" y="305" fill="#71829b" font-family="Arial, Helvetica, sans-serif" font-size="16">APPOINTMENT DATE</text>
    <text x="300" y="305" fill="#172033" font-family="Arial, Helvetica, sans-serif" font-size="18" font-weight="700">${escapeXml(date)}</text>
    ${memberRows}
    <text x="80" y="${height - 70}" fill="#dc2626" font-family="Arial, Helvetica, sans-serif" font-size="17" font-weight="700">Please bring this confirmation together with your required original documents.</text>
    <text x="80" y="${height - 40}" fill="#94a3b8" font-family="Arial, Helvetica, sans-serif" font-size="14">Embassy Appointment System</text>
  </svg>`;

  await downloadPngFromSvg(svg, "Family-Appointment-Confirmation.png", width, height);
}
