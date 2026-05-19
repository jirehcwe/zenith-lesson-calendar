export function getFallbackRegistrationLinkByLevel(level: string) {
  console.log("prefillRegistration level", level);
  switch (level) {
    
    case "J1":
      return "https://docs.google.com/forms/d/e/1FAIpQLSernavYiqWQTtxk5sVrY3XhIJvinMuQbuJMJEo4A5lsC6O9kQ/viewform?usp=pp_url&entry.175806084=SCHEDULE";
    case "J2":
      return "https://docs.google.com/forms/d/e/1FAIpQLScFgw2Zne6hrskI60EXbZ6PPYbaJyc_jiIl42wQdoWq5gZaWA/viewform?usp=pp_url&entry.175806084=SCHEDULE";
    case "S1":
      return "https://docs.google.com/forms/d/e/1FAIpQLSeu4cm3sHNrIGsvJoMJhXFm-uIdFAxi4aZyvfBkKeszf3b1Zg/viewform?usp=pp_url&entry.114913309=SCHEDULE";
    case "S2":
      return "https://docs.google.com/forms/d/e/1FAIpQLSdI8aA5uug-Fjr3epWF4TQ2mF3wNcXHUUEKqtHxTEJCW_Szcg/viewform?usp=pp_url&entry.1675169042=SCHEDULE";
    case "S3":
      return "https://docs.google.com/forms/d/e/1FAIpQLScpKH4O3YYxgn4pLPUuO1cALOuiBVUufsmmQcOE5GdtIF9kog/viewform?usp=pp_url&entry.1904315003=SCHEDULE";
    case "S4":
      return "https://docs.google.com/forms/d/e/1FAIpQLSfc-AI8j66HIXsrk5TrWFQxvNgxXvGr_vtsCIbTBxrRlLKOYw/viewform?usp=pp_url&entry.99365561=SCHEDULE";
    case "P4":
    case "P5":
    case "P6":
      return "https://docs.google.com/forms/d/e/1FAIpQLSdKVOkgkOg9V6XC1SHBz_SBuKxTRy02xIm_Pt19-52VSe-WHw/viewform"
    default:
      return "https://linktr.ee/learnatzenith";
  }
}
