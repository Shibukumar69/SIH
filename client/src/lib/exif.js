// ── Photo → location (EXIF GPS) ───────────────────────────────────────────────
// Reads the GPS tags embedded by most phone cameras straight out of a JPEG, with
// zero dependencies. This must run on the ORIGINAL file BEFORE compressImage(),
// because re-encoding through a canvas strips all EXIF metadata.
//
// Returns { lat, lng } in decimal degrees, or null if the photo carries no
// usable location (which is common — the caller must degrade gracefully).

export async function extractPhotoLocation(file) {
  try {
    if (!file) return null
    const type = (file.type || '').toLowerCase()
    if (type && !type.includes('jpeg') && !type.includes('jpg')) return null

    const buf = await file.arrayBuffer()
    const v = new DataView(buf)
    const total = v.byteLength
    if (total < 4 || v.getUint16(0, false) !== 0xffd8) return null // not a JPEG

    // Walk JPEG marker segments to find APP1 that begins with "Exif\0\0".
    // Segment lengths are ALWAYS big-endian, independent of EXIF byte order.
    let offset = 2
    let tiffStart = -1
    while (offset + 4 <= total) {
      const marker = v.getUint16(offset, false)
      if ((marker & 0xff00) !== 0xff00) break // out of the marker stream
      const size = v.getUint16(offset + 2, false)
      if (size < 2) break
      if (marker === 0xffe1 && offset + 4 + 6 <= total && v.getUint32(offset + 4, false) === 0x45786966) {
        tiffStart = offset + 4 + 6 // skip "Exif\0\0" → TIFF header start
        break
      }
      offset += 2 + size
    }
    if (tiffStart < 0 || tiffStart + 8 > total) return null

    const little = v.getUint16(tiffStart, false) === 0x4949 // "II" = little-endian
    const u16 = (p) => v.getUint16(p, little)
    const u32 = (p) => v.getUint32(p, little)
    if (u16(tiffStart + 2) !== 0x002a) return null

    // Find the GPS IFD pointer (tag 0x8825) inside IFD0.
    const ifd0 = tiffStart + u32(tiffStart + 4)
    if (ifd0 + 2 > total) return null
    let gpsPtr = 0
    const n0 = u16(ifd0)
    for (let i = 0; i < n0; i++) {
      const e = ifd0 + 2 + i * 12
      if (e + 12 > total) break
      if (u16(e) === 0x8825) { gpsPtr = tiffStart + u32(e + 8); break }
    }
    if (!gpsPtr || gpsPtr + 2 > total) return null

    // Read the GPS IFD entries we care about.
    const entries = {}
    const nG = u16(gpsPtr)
    for (let i = 0; i < nG; i++) {
      const e = gpsPtr + 2 + i * 12
      if (e + 12 > total) break
      entries[u16(e)] = e + 8 // value/offset field
    }

    const readTriplet = (valOff) => {
      const base = tiffStart + u32(valOff) // 3 rationals don't fit inline → follow offset
      const out = []
      for (let i = 0; i < 3; i++) {
        const num = u32(base + i * 8)
        const den = u32(base + i * 8 + 4)
        out.push(den ? num / den : 0)
      }
      return out
    }
    const readRefChar = (valOff) => String.fromCharCode(v.getUint8(valOff)) // ASCII ref is inline

    if (entries[2] == null || entries[4] == null) return null
    const [latD, latM, latS] = readTriplet(entries[2])
    const [lngD, lngM, lngS] = readTriplet(entries[4])
    let lat = latD + latM / 60 + latS / 3600
    let lng = lngD + lngM / 60 + lngS / 3600
    if (entries[1] != null && readRefChar(entries[1]) === 'S') lat = -lat
    if (entries[3] != null && readRefChar(entries[3]) === 'W') lng = -lng

    if (!isFinite(lat) || !isFinite(lng)) return null
    if (lat === 0 && lng === 0) return null
    if (Math.abs(lat) > 90 || Math.abs(lng) > 180) return null
    return { lat, lng }
  } catch {
    return null
  }
}
