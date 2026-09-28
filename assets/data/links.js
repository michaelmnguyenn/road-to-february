/* Every external link used in the plan. Tasks reference these as %token%. */
(function () {
  const DV = "https://youtu.be/";
  const DVL = "?list=PLUkh9m2BorqnKWu0g5ZUps_CbQ-JGtbI9";
  const DCL = "?list=PLUkh9m2BorqnDenjSLZ2DHIXrdxoN4Bn_";
  const DVAL = {1:"znmQ7oMiQrM",2:"8vYQpWXQ5hE",3:"xV80dt1OZtQ",4:"U3D9a_H_Vrs",5:"qKy5UGcvWaw",6:"N_FH89DCdGs",7:"8gYT3Xgs6NE",8:"fRNcP9xjk-8",9:"83yR6EFEl5Y",10:"9XHtztcbbUI",12:"QneDmX_WUyA",14:"WDZwqSierZ4",15:"42iyR6Geqiw",16:"xI-KTlxfNDU",17:"O8KojGTlz-E",18:"_ECSqmEppqA"};
  const DCF = {1:"Tdu0QPfoYZQ",4:"qofdyX0vudk",5:"584q2f4aTdc",6:"laJkrov4nqk",10:"rcVCKoJFjhk",12:"-OCBUKg_trY",13:"G6-W2ICTgPo",17:"pQYRAt6Z7Gw",23:"03Sx48LW7qQ",24:"C2XMM-E48BA",25:"F_6mcUPfoTk",34:"PKWOBNqgvPg"};
  const TOOL = "https://pages.stern.nyu.edu/~adamodar/podcasts/Webcasts/";

  const U = {
    damoData:"https://pages.stern.nyu.edu/~adamodar/New_Home_Page/datacurrent.html",
    damoBlog:"https://aswathdamodaran.blogspot.com/",
    damoVal:"https://pages.stern.nyu.edu/~adamodar/New_Home_Page/webcastvalonline.htm",
    damoCF:"https://pages.stern.nyu.edu/~adamodar/New_Home_Page/webcastcfonline.htm",
    mit401:"https://ocw.mit.edu/courses/15-401-finance-theory-i-fall-2008/",
    rareModels:"https://rareliquid.com/resources/models",
    rarePres:"https://rareliquid.com/resources/presentations",
    rba:"https://www.rba.gov.au/monetary-policy/",
    rbaTables:"https://www.rba.gov.au/statistics/tables/",
    zeta:"https://arithmetic.zetamac.com/",
    macab:"https://macabacus.com/blog/improving-model-readability-with-color-formatting",
    cfiXL:"https://corporatefinanceinstitute.com/course/excel-fundamentals-formulas-for-finance/",
    aaStruct:"https://www.theanalystacademy.com/consulting-slide-structure/",
    aaSCQA:"https://www.theanalystacademy.com/powerpoint-storytelling/",
    aaMck:"https://www.theanalystacademy.com/mckinsey-slide-breakdown/",
    aaRedo:"https://www.theanalystacademy.com/mckinsey-slides-redesigned/",
    aa600:"https://www.theanalystacademy.com/consulting-presentations/",
    mckInt:"https://www.mckinsey.com/careers/interviewing",
    diconsa:"https://www.mckinsey.com/careers/interviewing/diconsa",
    electro:"https://www.mckinsey.com/careers/interviewing/electrolight",
    globa:"https://www.mckinsey.com/careers/interviewing/globapharm",
    natEd:"https://www.mckinsey.com/careers/interviewing/national-education",
    bcg:"https://careers.bcg.com/global/en/case-interview-preparation",
    bainCoffee:"https://www.bain.com/careers/interview-prep/case-library/coffee-case-study/",
    bainFashion:"https://www.bain.com/careers/interview-prep/case-library/fashioco-case-study/",
    owDairy:"https://www.oliverwyman.com/careers/entry-level/interview-preparation/dairy-farm-case-interview.html",
    owPharm:"https://www.oliverwyman.com/careers/entry-level/interview-preparation/supermarket-pharmacy-case-interview.html",
    owPoseidon:"https://www.oliverwyman.com/careers/entry-level/interview-preparation/poseidon-water-park-case-interview.html",
    owOil:"https://www.oliverwyman.com/careers/entry-level/interview-preparation/oil-gas-price-strategy-case-interview.html",
    owPrep:"https://www.oliverwyman.com/careers/entry-level/interview-preparation.html",
    occLeisure:"https://cdn.shopify.com/s/files/1/0417/7869/files/OC_C_-_Leisure_clubs.pdf",
    footloose:"https://cdn.shopify.com/s/files/1/0417/7869/files/Monitor_Written_Case_Footloose.pdf",
    casebooks:"https://www.hackingthecaseinterview.com/pages/mba-consulting-casebooks",
    wharton08:"https://wp.stolaf.edu/pipercenter/files/2015/06/wharton-2008a.pdf",
    htci:"https://www.youtube.com/channel/UCIJI3d_oQvKMdNbwBi3OFXA",
    cheng:"https://www.youtube.com/playlist?list=PLL1jLM18SWP1uF1ReVpWY9MSpFXWdmEfW",
    mi400:"https://mergersandinquisitions.com/400-questions-investment-banking/",
    wow26:"https://www.woolworthsgroup.com.au/content/dam/wwg/investors/reports/f26/Woolworths%20Group%202026%20Annual%20Report.pdf",
    wowRes:"https://www.woolworthsgroup.com.au/au/en/investors/our-performance/results-and-presentations.html",
    col26:"https://www.colesgroup.com.au/FormBuilder/_Resource/_module/ir5sKeTxxEOndzdh00hWJw/file/Annual_Report.pdf",
    cba26:"https://www.commbank.com.au/content/dam/commbank-assets/investors/2026/CBA-2026-Annual-Report.pdf",
    bhp26:"https://www.bhp.com/-/media/documents/investors/annual-reports/2026/260818_bhpannualreport2026.pdf",
    xero:"https://www.xero.com/us/investors/financial-information/",
    csl:"https://investors.csl.com/annualreport/2026/",
    qan26:"https://investor.qantas.com/FormBuilder/_Resource/_module/doLLG5ufYkCyEPjF1tpgyw/file/annual-reports/2026-Annual-Report.pdf",
    qanPres:"https://investor.qantas.com/FormBuilder/_Resource/_module/doLLG5ufYkCyEPjF1tpgyw/file/2026FY/QAN_FY26_Investor_Presentation.pdf",
    qanArchive:"https://investor.qantas.com/investors/?page=annual-reports",
    tcl:"https://www.transurban.com/investor-centre/reporting-suite",
    ozl:"https://announcements.asx.com.au/asxpdf/20230309/pdf/45mhv7xk309ctr.pdf",
    qube:"https://qube.com.au/wp-content/uploads/2026/04/ASX-Scheme-Booklet-registered-with-ASIC-on-23-April-2026.pdf",
    qubeMac:"https://www.macquarie.com/au/en/about/news/2026/macquarie-asset-management-led-consortium-enters-binding-agreement-to-acquire-qube.html",
    apt:"https://announcements.asx.com.au/asxpdf/20211105/pdf/452mnlqysb2nns.pdf",
    wesIER:"https://www.wesfarmers.com.au/docs/default-source/asx-announcements/demerger-of-coles---independent-expert's-report.pdf?sfvrsn=70a535bb_0",
    brk:"https://www.berkshirehathaway.com/letters/letters.html",
    brk2011:"https://www.berkshirehathaway.com/letters/2011ltr.pdf",
    asx:"https://www.asx.com.au/markets/trade-our-cash-market/announcements",
    street:"https://www.afr.com/street-talk",
    euri:"https://alexeuripidou.com/blogs/news/break-into-investment-banking-australia",
    prepped:"https://www.preppedtalent.com.au/ib_pe_roles",
    prosple:"https://au.prosple.com/investment-banking-internships-australia",
    gradc:"https://au.gradconnection.com/internships/investment-banking/",
    acq:"https://www.acquired.fm/",
    oddlots:"https://www.bloomberg.com/oddlots",
    levine:"https://www.bloomberg.com/account/newsletters/money-stuff",
    uqlib:"https://www.library.uq.edu.au/"
  };

  function resolve(tok) {
    if (/^dv\d+$/.test(tok)) return DV + DVAL[+tok.slice(2)] + DVL;
    if (/^dc\d+$/.test(tok)) return DV + DCF[+tok.slice(2)] + DCL;
    if (tok.startsWith("RL:")) return "https://www.youtube.com/watch?v=" + tok.slice(3);
    if (tok.startsWith("TOOL:")) return TOOL + tok.slice(5);
    return U[tok] || "#";
  }

  window.RTF = window.RTF || {};
  window.RTF.U = U;
  window.RTF.resolve = resolve;
})();
