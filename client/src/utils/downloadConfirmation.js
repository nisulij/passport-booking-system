function esc(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function safeFile(value) {
  return String(value || "confirmation")
    .replace(/[^a-z0-9_-]+/gi, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || "confirmation";
}

function wrapText(value, maxChars = 42) {
  const text = String(value ?? "");
  if (text.length <= maxChars) return [text];
  const words = text.split(/\s+/);
  const lines = [];
  let line = "";
  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (next.length > maxChars && line) {
      lines.push(line);
      line = word;
    } else {
      line = next;
    }
  }
  if (line) lines.push(line);
  return lines.length ? lines : [""];
}

function textBlock(lines, x, y, size, weight = 400, fill = "#172033", lineGap = 24) {
  return `<text x="${x}" y="${y}" font-family="Arial, Helvetica, sans-serif" font-size="${size}px" font-weight="${weight}" fill="${fill}">${lines.map((line, i) => `<tspan x="${x}" dy="${i === 0 ? 0 : lineGap}">${esc(line)}</tspan>`).join("")}</text>`;
}

function makeSvg({ title, subtitle, token, rows, familyMembers = [] }) {
  const width = 1200;
  const baseHeight = familyMembers.length ? 520 + familyMembers.length * 150 : 720;
  const height = baseHeight;
  let y = 235;
  let body = "";

  if (token) {
    body += `
      <rect x="820" y="225" width="300" height="145" rx="22" fill="#edf4ff"/>
      <text x="850" y="265" font-family="Arial, Helvetica, sans-serif" font-size="18px" font-weight="700" fill="#274a78">APPOINTMENT TOKEN</text>
      ${textBlock(wrapText(token, 18), 850, 310, 30, 700, "#183b67", 38)}
    `;
  }

  if (familyMembers.length) {
    y = 235;
    familyMembers.forEach((member, index) => {
      const top = y + index * 145;
      body += `
        <rect x="80" y="${top}" width="1040" height="120" rx="18" fill="#fbfcfe" stroke="#dbe4ef"/>
        <text x="110" y="${top + 32}" font-family="Arial, Helvetica, sans-serif" font-size="14px" font-weight="700" fill="#8a9bb1">MEMBER ${index + 1}</text>
        ${textBlock(wrapText(member.name || "", 35), 110, top + 64, 22, 700, "#172033", 28)}
        <text x="110" y="${top + 98}" font-family="Arial, Helvetica, sans-serif" font-size="17px" fill="#7085a0">${esc(member.slot || "")} ${member.purpose ? `· ${esc(member.purpose)}` : ""}</text>
        <rect x="850" y="${top + 20}" width="240" height="80" rx="14" fill="#244875"/>
        <text x="970" y="${top + 45}" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="12px" font-weight="700" fill="#dbeafe">TOKEN</text>
        ${textBlock(wrapText(member.token || "", 15), 970, top + 75, 22, 700, "#ffffff", 26).replace(/x="970"/g, 'x="970" text-anchor="middle"')}
      `;
    });
    y += familyMembers.length * 145 + 20;
  } else {
    rows.forEach(([label, value]) => {
      const lines = wrapText(value, 52);
      const rowHeight = Math.max(62, lines.length * 25 + 28);
      body += `
        <rect x="80" y="${y}" width="1040" height="${rowHeight}" rx="12" fill="#fbfcfe"/>
        <text x="110" y="${y + 38}" font-family="Arial, Helvetica, sans-serif" font-size="16px" font-weight="700" fill="#71839b">${esc(label)}</text>
        ${textBlock(lines, 360, y + 38, 18, 600, "#172033", 25)}
      `;
      y += rowHeight + 10;
    });
  }

  const footerY = height - 70;
  return `<?xml version="1.0" encoding="UTF-8"?>
  <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
    <rect width="${width}" height="${height}" fill="#f5f8fc"/>
    <rect x="50" y="45" width="1100" height="${height - 90}" rx="28" fill="#ffffff" stroke="#dbe4ef"/>
    <rect x="50" y="45" width="1100" height="150" rx="28" fill="#244875"/>
    <rect x="50" y="165" width="1100" height="30" fill="#244875"/>
    <text x="90" y="105" font-family="Arial, Helvetica, sans-serif" font-size="34px" font-weight="700" fill="#ffffff">EMBASSY APPOINTMENT</text>
    <text x="90" y="145" font-family="Arial, Helvetica, sans-serif" font-size="19px" fill="#e6eef8">Appointment Confirmation</text>
    <circle cx="1065" cy="120" r="34" fill="#edf4ff"/>
    <path d="M1048 120 l12 12 l23 -28" fill="none" stroke="#16834b" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>
    <text x="90" y="235" font-family="Arial, Helvetica, sans-serif" font-size="28px" font-weight="700" fill="#172033">${esc(title)}</text>
    <text x="90" y="270" font-family="Arial, Helvetica, sans-serif" font-size="18px" fill="#71839b">${esc(subtitle)}</text>
    ${body}
    <text x="90" y="${footerY}" font-family="Arial, Helvetica, sans-serif" font-size="16px" font-weight="700" fill="#dc2626">Please bring this confirmation together with your required original documents.</text>
    <text x="90" y="${footerY + 28}" font-family="Arial, Helvetica, sans-serif" font-size="13px" fill="#9aabc0">Embassy Appointment System</text>
  </svg>`;
}

async function downloadSvgAsPng(svg, filename) {
  const blob = new Blob([svg], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  try {
    const img = new Image();
    img.decoding = "async";
    img.src = url;
    await new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = reject;
    });

    const svgMatch = svg.match(/width="(\d+)" height="(\d+)"/);
    const width = svgMatch ? Number(svgMatch[1]) : 1200;
    const height = svgMatch ? Number(svgMatch[2]) : 720;
    const scale = 2;
    const canvas = document.createElement("canvas");
    canvas.width = width * scale;
    canvas.height = height * scale;
    const ctx = canvas.getContext("2d");
    ctx.setTransform(scale, 0, 0, scale, 0, 0);
    ctx.drawImage(img, 0, 0, width, height);

    const pngBlob = await new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
    if (!pngBlob) throw new Error("Could not create PNG confirmation.");

    const downloadUrl = URL.createObjectURL(pngBlob);
    const link = document.createElement("a");
    link.href = downloadUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(downloadUrl);
  } finally {
    URL.revokeObjectURL(url);
  }
}

export async function downloadIndividualConfirmation(booking) {
  const svg = makeSvg({
    title: "Booking Confirmed",
    subtitle: "Please bring this confirmation on your appointment day.",
    token: booking?.token,
    rows: [
      ["Service", "Passport"],
      ["Applicant Name", `${booking?.title || ""} ${booking?.name || ""}`.trim()],
      ["Appointment Date", booking?.date || ""],
      ["Appointment Time", booking?.slot || ""],
      ["Email", booking?.email || ""],
      ["Phone", booking?.phone || ""],
    ],
  });
  await downloadSvgAsPng(svg, `Appointment-Confirmation-${safeFile(booking?.token || booking?.name)}.png`);
}

export async function downloadFamilyConfirmation({ email, date, members, tokens }) {
  const familyMembers = (members || []).map((member, index) => ({
    ...member,
    token: tokens?.[index] || "",
  }));
  const svg = makeSvg({
    title: "Family Booking Confirmed",
    subtitle: `Appointment date: ${date || ""} · Family email: ${email || ""}`,
    familyMembers,
    rows: [],
  });
  await downloadSvgAsPng(svg, `Family-Appointment-Confirmation-${safeFile(date)}.png`);
}

export async function downloadAppointmentConfirmation(booking) {
  const svg = makeSvg({
    title: "Birth Certificate Appointment Confirmed",
    subtitle: "Please keep your appointment token and present it when attending the Embassy.",
    token: booking?.token,
    rows: [
      ["Service", "Birth Certificate"],
      ["Applicant Name", booking?.name || ""],
      ["Appointment Date", booking?.date || ""],
      ["Appointment Time", booking?.slot || ""],
      ["Email", booking?.email || ""],
      ["Phone", booking?.phone || ""],
    ],
  });
  await downloadSvgAsPng(svg, `Birth-Certificate-Confirmation-${safeFile(booking?.token || booking?.name)}.png`);
}
