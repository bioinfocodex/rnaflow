// ── GENE FAMILY DATA ──────────────────────────────────────────────────────
const GF = {
  tf: [
    {id:'myb',     name:'MYB Family',          desc:'R2R3-MYB transcription factors regulating development, stress, and secondary metabolism.',  db:'PlantTFDB / AnimalTFDB', org:'🌱🐾', patterns:['MYB','OsMYB','ZmMYB','TaMYB','GmMYB'],  keyw:'MYB'},
    {id:'bhlh',    name:'bHLH Family',          desc:'Basic helix-loop-helix TFs controlling light response, flowering, anthocyanin, iron acquisition.', db:'PlantTFDB / AnimalTFDB', org:'🌱🐾', patterns:['bHLH','MYC','HLH','PHYTOCHROME'],  keyw:'bHLH|MYC[0-9]'},
    {id:'wrky',    name:'WRKY Family',           desc:'Plant-specific TFs with WRKYGQK motif, major regulators of stress and defense responses.', db:'PlantTFDB', org:'🌱', patterns:['WRKY'],  keyw:'WRKY'},
    {id:'bzip',    name:'bZIP Family',           desc:'Basic leucine zipper TFs: ABA signalling (ABF/ABRE), light responses, pathogen defense.', db:'PlantTFDB / AnimalTFDB', org:'🌱🐾', patterns:['bZIP','ABF','HY5','GBF','ATB2','ZIP'],  keyw:'bZIP|ABF[0-9]|HY5'},
    {id:'mads',    name:'MADS-box Family',       desc:'MADS transcription factors controlling floral organ identity, fruit development, root growth.', db:'PlantTFDB / AnimalTFDB', org:'🌱🐾', patterns:['MADS','MAD','SEP','AP1','AP3','AG','FUL','SOC'],  keyw:'MADS|SOC1|SEP[0-9]'},
    {id:'nac',     name:'NAC Family',            desc:'Plant-specific NAC TFs: senescence, secondary wall thickening, abiotic stress tolerance.', db:'PlantTFDB', org:'🌱', patterns:['NAC','ANAC','OsNAC','ZmNAC','TaNAC','GmNAC','VND','NST'],  keyw:'NAC'},
    {id:'erf',     name:'ERF/AP2 Family',        desc:'Ethylene Response Factors and AP2 domain proteins: ethylene signalling, drought, cold stress.', db:'PlantTFDB', org:'🌱', patterns:['ERF','AP2','DREB','CBF','RAP2','EIN3','EIL'],  keyw:'ERF|AP2|DREB|CBF'},
    {id:'gras',    name:'GRAS Family',           desc:'DELLA proteins (GA signalling), SCR, SHR (root development), HAM (meristem maintenance).', db:'PlantTFDB', org:'🌱', patterns:['GRAS','DELLA','GAI','RGA','SCR','SHR','HAM'],  keyw:'GRAS|DELLA|SCR|SHR'},
    {id:'hsf',     name:'Heat Shock Factors (HSF)', desc:'Master regulators of heat stress response, transcriptional activators of HSP genes.', db:'PlantTFDB / AnimalTFDB', org:'🌱🐾', patterns:['HSF','HSFA','HSFB','HSFC','HSTF'],  keyw:'HSF'},
    {id:'c2h2',    name:'C2H2 Zinc Finger',      desc:'Largest TF family in plants and animals; roles in development, stress, transcriptional repression.', db:'PlantTFDB / AnimalTFDB', org:'🌱🐾', patterns:['C2H2','ZFP','KZM','ZAT','STZ','AZF'],  keyw:'ZFP|ZAT|KZM'},
    {id:'c3h',     name:'C3H Zinc Finger',        desc:'CCCH zinc finger RNA-binding and TF proteins; stress response and RNA processing.', db:'PlantTFDB', org:'🌱', patterns:['C3H','CCCH','TZF','AtC3H'],  keyw:'C3H|TZF'},
    {id:'dof',     name:'DOF Family',             desc:'Plant-specific DOF domain TFs: seed maturation, germination, photoperiod, starch biosynthesis.', db:'PlantTFDB', org:'🌱', patterns:['DOF','OBP','DAG','COG','ZIM'],  keyw:'DOF|OBP'},
    {id:'lbd',     name:'LBD/LOB Family',         desc:'Lateral organ boundary domain TFs: lateral root initiation, organ boundary specification.', db:'PlantTFDB', org:'🌱', patterns:['LBD','LOB','OsLBD','ZmLBD','ASL'],  keyw:'LBD|LOB|ASL'},
    {id:'tcp',     name:'TCP Family',             desc:'Plant-specific TFs controlling leaf shape, branching, circadian clock (CCA1, LHY).', db:'PlantTFDB', org:'🌱', patterns:['TCP','CCA1','LHY','PCF','OsTCP'],  keyw:'TCP|PCF'},
    {id:'arf',     name:'ARF Family (Auxin)',      desc:'Auxin Response Factors: direct transcriptional effectors of auxin signalling.', db:'PlantTFDB', org:'🌱', patterns:['ARF','OsARF','ZmARF','TaARF','GmARF'],  keyw:'ARF[0-9]'},
    {id:'hox',     name:'HOX / Homeobox',         desc:'Homeodomain TFs critical for body plan development in animals; HD-ZIP in plants.', db:'AnimalTFDB / PlantTFDB', org:'🌱🐾', patterns:['HOX','HOXA','HOXB','HOXC','HOXD','HDG','PHB','REV'],  keyw:'HOX|HDG|PHB'},
    {id:'sox',     name:'SOX Family (HMG)',        desc:'SRY-box TFs controlling sex determination, neural development, stem cell maintenance.', db:'AnimalTFDB', org:'🐾', patterns:['SOX','SRY','HMG'],  keyw:'SOX[0-9]|SRY'},
    {id:'forkhead',name:'Forkhead (FOX) Family',  desc:'FOX transcription factors: metabolism, longevity, immune response, development.', db:'AnimalTFDB', org:'🐾', patterns:['FOX','FOXA','FOXO','FOXP','FOXQ'],  keyw:'FOX[A-Z]'},
    {id:'ets',     name:'ETS Family',             desc:'ETS domain TFs: haematopoiesis, angiogenesis, invasion, oncogenesis.', db:'AnimalTFDB', org:'🐾', patterns:['ETS','ETV','ERG','FLI','ELK','ELF','PEA','GABP','SPI'],  keyw:'ETS|ETV|ERG|ELK'},
    {id:'nfkb',    name:'NF-κB Family',           desc:'Master regulators of inflammatory and immune responses; also apoptosis and cell survival.', db:'AnimalTFDB', org:'🐾', patterns:['NFKB','RELA','RELB','NFKB1','NFKB2','REL','IKK'],  keyw:'NFKB|REL[A-B]'},
    {id:'p53',     name:'p53 / p63 / p73 Family', desc:'Tumor suppressor TFs regulating apoptosis, DNA repair, cell cycle arrest.', db:'AnimalTFDB', org:'🐾', patterns:['TP53','TP63','TP73','P53','P63','P73'],  keyw:'TP53|TP63|TP73'},
    {id:'gata',    name:'GATA Family',            desc:'GATA zinc finger TFs: hematopoiesis, endoderm development, gonadal differentiation.', db:'AnimalTFDB', org:'🐾', patterns:['GATA1','GATA2','GATA3','GATA4','GATA5','GATA6'],  keyw:'GATA[1-6]'},
    {id:'stat',    name:'STAT Family',            desc:'Signal transducers and activators of transcription; cytokine and growth factor signalling.', db:'AnimalTFDB', org:'🐾', patterns:['STAT1','STAT2','STAT3','STAT4','STAT5','STAT6'],  keyw:'STAT[1-6]'},
  ],
  kinase: [
    {id:'mapk',    name:'MAPK Cascade',           desc:'Mitogen-activated protein kinases: stress signal transduction, immune activation, cell division.', db:'KEGG / Pfam', org:'🌱🐾', patterns:['MAPK','MAP2K','MAP3K','MKK','MEK','ERK','JNK','MPK'],  keyw:'MAPK|MPK[0-9]|MKK'},
    {id:'cdk',     name:'Cyclin-Dependent Kinases (CDK)', desc:'Cell cycle progression, transcription regulation; CDK-cyclin complexes.', db:'KEGG / Pfam', org:'🌱🐾', patterns:['CDK','CDKA','CDKB','CYCA','CYCB','CYCD','CYC'],  keyw:'CDK[A-Z]|CYC[A-Z]'},
    {id:'rlk',     name:'Receptor-Like Kinases (RLK)', desc:'Largest plant kinase family; pattern recognition, hormone perception, development signalling.', db:'iTAK / Pfam', org:'🌱', patterns:['RLK','LRR-RLK','LRK','HAK','BAK','BRI','FLS','EFR','PEPR'],  keyw:'LRK[0-9]|RLK'},
    {id:'snrk',    name:'SnRK / AMPK Family',     desc:'Sucrose non-fermenting related kinases: energy sensing, ABA signalling, autophagy.', db:'iTAK', org:'🌱🐾', patterns:['SnRK','KIN','AMPK','OST','GRIK','AKIN'],  keyw:'SnRK|AMPK|KIN[0-9]'},
    {id:'camk',    name:'CaM Kinases (CDPK/CAMK)', desc:'Calcium-dependent protein kinases: calcium signal transduction, stress responses.', db:'iTAK / Pfam', org:'🌱🐾', patterns:['CDPK','CPK','CAMK','CaM','CML','CBL','CIPK'],  keyw:'CPK[0-9]|CDPK|CAMK'},
    {id:'psk',     name:'Phytosulfokine Receptor Kinases', desc:'Peptide hormone perception, cell proliferation and differentiation signals.', db:'iTAK', org:'🌱', patterns:['PSKR','PSY','CLV','WUS','CLE'],  keyw:'PSKR|CLV[0-9]'},
    {id:'pi3k',    name:'PI3-Kinase / TOR Pathway', desc:'Phosphoinositide 3-kinases and TOR signalling: nutrient sensing, autophagy, growth.', db:'KEGG', org:'🌱🐾', patterns:['PI3K','PIK3','TOR','TORC','RAPTOR','S6K','4EBP'],  keyw:'PIK3|TOR|RAPTOR'},
    {id:'tyrosine_k',name:'Tyrosine Kinases (RTK)', desc:'Receptor tyrosine kinases: growth factor signalling, oncogenesis, differentiation.', db:'KEGG / Pfam', org:'🐾', patterns:['EGFR','ERBB','FGFR','PDGFR','VEGFR','MET','KIT','ALK','RET'],  keyw:'EGFR|FGFR|ERBB|PDGFR'},
  ],
  phosphatase: [
    {id:'pp2c',    name:'PP2C Phosphatases',      desc:'Type 2C protein phosphatases; ABA co-receptors, stress signal attenuation.', db:'Pfam', org:'🌱🐾', patterns:['PP2C','ABI1','ABI2','HAB','AHG','HopAI'],  keyw:'PP2C|ABI[12]'},
    {id:'dsp',     name:'Dual-Specificity Phosphatases (DSP/MKP)', desc:'Inactivate MAPKs; cell cycle regulation, immune suppression.', db:'Pfam', org:'🌱🐾', patterns:['DSP','MKP','DUSP','PTP','IBR'],  keyw:'DUSP|MKP[0-9]'},
    {id:'ptp',     name:'Protein Tyrosine Phosphatases (PTP)', desc:'Counterbalance tyrosine kinases; tumour suppressors (PTEN), immune checkpoints.', db:'Pfam', org:'🐾', patterns:['PTP','PTEN','PTPN','PTPRC','CD45'],  keyw:'PTEN|PTPN|PTPR'},
  ],
  transporter: [
    {id:'abc',     name:'ABC Transporters',       desc:'ATP-binding cassette transporters: drug efflux, lipid transport, auxin, glucosinolates.', db:'Pfam / KEGG', org:'🌱🐾', patterns:['ABC','ABCA','ABCB','ABCC','ABCG','MDR','PDR','MRP','TAP'],  keyw:'ABC[A-G]|MDR|PDR'},
    {id:'aquaporin',name:'Aquaporins (MIP)',       desc:'Water and small solute channels: PIP (plasma membrane), TIP (tonoplast), NIP, SIP, XIP.', db:'Pfam', org:'🌱🐾', patterns:['PIP','TIP','NIP','SIP','XIP','AQP','Aquaporin','MIP'],  keyw:'PIP[12]|TIP[0-9]|AQP'},
    {id:'sugar_t', name:'Sugar Transporters (SUT/SWEET)', desc:'SUT: sucrose/H+ symporters for phloem loading. SWEET: bidirectional sugar facilitators.', db:'Pfam', org:'🌱', patterns:['SUT','SUC','SWEET','STP','PLT','AtSUC'],  keyw:'SUT|SWEET|STP[0-9]'},
    {id:'nrt',     name:'Nitrate Transporters (NRT/NPF)', desc:'Nitrate uptake and long-distance transport; NRT1/NPF and NRT2/NRT families.', db:'Pfam', org:'🌱', patterns:['NRT','NPF','NRT1','NRT2','CHL1','NIN'],  keyw:'NRT[12]|NPF'},
    {id:'pht',     name:'Phosphate Transporters (PHT)', desc:'High- and low-affinity phosphate uptake; mycorrhizal-induced (PT) transporters.', db:'Pfam', org:'🌱', patterns:['PHT','PHO','PT','AtPT','OsPHT'],  keyw:'PHT[0-9]|PHO[0-9]'},
    {id:'hak',     name:'K+ Transporters (HAK/KT/KUP)', desc:'High-affinity potassium transporters; K+ uptake under deficiency.', db:'Pfam', org:'🌱', patterns:['HAK','KT','KUP','CHX','AtHAK','OsHAK'],  keyw:'HAK|KUP|KT[0-9]'},
    {id:'zip',     name:'ZIP Metal Transporters',  desc:'Zinc-Iron Permease: Zn²⁺, Fe²⁺, Mn²⁺ uptake into cytoplasm.', db:'Pfam', org:'🌱🐾', patterns:['ZIP','IRT','ZRT','SLC39','ZNT'],  keyw:'ZIP[0-9]|IRT[12]|SLC39'},
    {id:'ysl',     name:'YSL / OPT Transporters',  desc:'Yellow Stripe Like transporters: nicotianamine-metal chelate transport, Fe homeostasis.', db:'Pfam', org:'🌱', patterns:['YSL','OPT','AtYSL','OsYSL'],  keyw:'YSL[0-9]'},
    {id:'nramp',   name:'NRAMP Metal Transporters', desc:'Natural resistance-associated macrophage proteins: Fe²⁺, Mn²⁺, Cd²⁺ transport.', db:'Pfam', org:'🌱🐾', patterns:['NRAMP','MntH','DMT','SLC11','AtNRAMP'],  keyw:'NRAMP|SLC11'},
    {id:'slc',     name:'SLC Solute Carrier Family', desc:'Largest animal transporter superfamily (>400 members): amino acids, sugars, ions, drugs.', db:'KEGG / Pfam', org:'🐾', patterns:['SLC','GLUT','LAT','CAT','OCT','MCT'],  keyw:'SLC[0-9]|GLUT[0-9]'},
    {id:'ion_ch',  name:'Ion Channels — Voltage-gated', desc:'Voltage-gated Na⁺, K⁺, Ca²⁺ channels: action potential, nerve/muscle excitability.', db:'KEGG / Pfam', org:'🐾', patterns:['KCNA','KCNB','SCN','CACNA','HCN','KCNQ'],  keyw:'KCNA|KCNB|SCN[0-9]|CACNA'},
  ],
  ubiquitin: [
    {id:'e3_ub',   name:'E3 Ubiquitin Ligases',   desc:'RING, U-box, CULLIN, HECT E3 ligases: target specificity of protein degradation.', db:'Pfam / KEGG', org:'🌱🐾', patterns:['CUL','RBX','SKP','F-box','RING','HECT','HECTD','NEDD4','SMURF','PUB'],  keyw:'CUL[0-9]|SKP|HECT|RING'},
    {id:'skp_fbox',name:'F-box / SCF Complex',    desc:'F-box proteins provide substrate specificity to SCF ubiquitin E3 ligase complexes.', db:'Pfam', org:'🌱🐾', patterns:['FBX','F-box','SKP','TIR1','COI1','EBF','UFO','ORE'],  keyw:'FBX|TIR1|COI1'},
    {id:'ubox',    name:'U-box / PUB Family',      desc:'Plant U-box E3 ligases; immune response, ABA signalling, stress tolerance.', db:'Pfam', org:'🌱', patterns:['PUB','U-box','ARM','CMPG'],  keyw:'PUB[0-9]'},
    {id:'ubp',     name:'Ubiquitin Proteases (UBP/DUB)', desc:'Deubiquitinating enzymes: reverse ubiquitination, regulate protein stability and signalling.', db:'Pfam', org:'🌱🐾', patterns:['UBP','USP','UCH','DUB','OTU','JAMM'],  keyw:'UBP[0-9]|USP[0-9]'},
  ],
  hsp: [
    {id:'hsp70',   name:'HSP70 Family',            desc:'Major molecular chaperones; protein folding, translocation, stress recovery, ERAD.', db:'Pfam', org:'🌱🐾', patterns:['HSP70','BiP','GRP78','DnaK','HSC70','HSPA'],  keyw:'HSP70|HSPA[0-9]|BiP|GRP78'},
    {id:'hsp90',   name:'HSP90 Family',            desc:'HSP90 chaperones: client protein maturation, steroid receptor signalling, kinase stability.', db:'Pfam', org:'🌱🐾', patterns:['HSP90','HSPC','GRP94','HtpG'],  keyw:'HSP90|HSPC'},
    {id:'hsp20',   name:'Small HSP (sHSP / HSP20)', desc:'Small heat shock proteins with alpha-crystallin domain; thermotolerance, prevent aggregation.', db:'Pfam', org:'🌱🐾', patterns:['HSP20','sHSP','HSP17','HSP18','HSP26','CRYAB','HSPB'],  keyw:'HSP1[5-9]|HSP2[0-6]|HSPB'},
    {id:'hsp60',   name:'HSP60 / Chaperonin',      desc:'Chaperonins (GroEL/GroES): mitochondrial and plastid protein folding.', db:'Pfam', org:'🌱🐾', patterns:['HSP60','CPNA','CPNB','CPN60','CCT','TriC','GroEL'],  keyw:'HSP60|CPN60|CCT[0-9]'},
    {id:'hsp40',   name:'HSP40 / J-domain (DNAJ)', desc:'Co-chaperones that stimulate ATPase activity of HSP70 and target substrates.', db:'Pfam', org:'🌱🐾', patterns:['HSP40','DNAJ','DjA','DjB','DjC','J-domain','ATJ'],  keyw:'DNAJ|HSP40'},
  ],
  rrp: [
    {id:'rbp',     name:'RNA-Binding Proteins (RBP/RRM)', desc:'RRM domain proteins: mRNA splicing, stability, translation regulation, stress granules.', db:'Pfam', org:'🌱🐾', patterns:['RBP','RRM','RNP','HuD','HuR','ELAVL','HNRNP'],  keyw:'RBP[0-9]|RRM|HNRNP'},
    {id:'dead',    name:'DEAD-box RNA Helicases',  desc:'ATP-dependent RNA secondary structure unwinding; ribosome biogenesis, splicing, RNA decay.', db:'Pfam', org:'🌱🐾', patterns:['DEAD','DDX','DHX','eIF4A','RCF1','LOS4'],  keyw:'DDX[0-9]|DHX[0-9]|DEAD'},
    {id:'pentatricopeptide',name:'PPR Proteins',   desc:'Plant-specific pentatricopeptide repeat proteins; RNA editing, splicing, and processing in organelles.', db:'Pfam / PlantTFDB', org:'🌱', patterns:['PPR','pentatricopeptide','EMB','OTP'],  keyw:'PPR'},
    {id:'mir_proc',name:'miRNA Processing Proteins', desc:'DICER, DROSHA, AGO proteins involved in miRNA and siRNA biogenesis.', db:'Pfam / KEGG', org:'🌱🐾', patterns:['DCL','AGO','HEN1','HYL1','DICER','DROSHA','DGCR8'],  keyw:'DCL[0-9]|AGO[0-9]|DICER'},
  ],
  ribosomal: [
    {id:'rps',     name:'40S Ribosomal Proteins (RPS)', desc:'Small subunit ribosomal proteins; translation initiation and elongation.', db:'Pfam', org:'🌱🐾', patterns:['RPS','At1GRPS','MRPS'],  keyw:'RPS[0-9]'},
    {id:'rpl',     name:'60S Ribosomal Proteins (RPL)', desc:'Large subunit ribosomal proteins; peptide bond formation and elongation.', db:'Pfam', org:'🌱🐾', patterns:['RPL','MRPL'],  keyw:'RPL[0-9]'},
    {id:'eif',     name:'Translation Initiation Factors (eIF)', desc:'Eukaryotic initiation factors; cap-binding, ribosome recruitment, start codon selection.', db:'Pfam', org:'🌱🐾', patterns:['eIF','IF1','IF2','IF3','IF4','IF5','IF6'],  keyw:'EIF[0-9]'},
  ],
  cytoskeleton: [
    {id:'actin',   name:'Actin / Profilin Family', desc:'Actin cytoskeleton dynamics: cell shape, division, motility, organelle positioning.', db:'Pfam', org:'🌱🐾', patterns:['ACT','actin','PRF','profilin','ADF','cofilin','ARP'],  keyw:'ACT[0-9]|PRF[0-9]'},
    {id:'tubulin', name:'Tubulin / Kinesin Family', desc:'Microtubule cytoskeleton: cell division, intracellular transport, flagella.', db:'Pfam', org:'🌱🐾', patterns:['TUB','tubulin','KIN','kinesin','dynein','KRP','ATK'],  keyw:'TUA|TUB|KRP[0-9]'},
    {id:'myosin',  name:'Myosin Family',            desc:'Actin-based motor proteins: vesicle trafficking, cytoplasmic streaming, cell division.', db:'Pfam', org:'🌱🐾', patterns:['MYO','myosin','AT-MYO','XIK'],  keyw:'MYO[0-9]|XI[A-K]'},
  ],
  hormone_plant: [
    {id:'auxin',   name:'Auxin Pathway (ARF/AUX/IAA)', desc:'Core auxin signalling: TIR1/AFB receptors, Aux/IAA repressors, ARF TFs, GH3, SAUR.', db:'PlantTFDB / KEGG', org:'🌱', patterns:['ARF','AUX','IAA','GH3','SAUR','TIR1','AFB','PIN','AUX1','LAX'],  keyw:'ARF[0-9]|IAA[0-9]|GH3|SAUR'},
    {id:'ga',      name:'Gibberellin Pathway',      desc:'GA biosynthesis (GA20ox, GA3ox), catabolism (GA2ox), receptors (GID1), DELLA repressors.', db:'PlantTFDB / KEGG', org:'🌱', patterns:['GA20','GA3ox','GA2ox','GID1','DELLA','GAI','RGA','GRS','CPS','KAO'],  keyw:'GA[0-9]ox|GID1|DELLA|GAI'},
    {id:'ck',      name:'Cytokinin Pathway',        desc:'CK receptors (AHK), phosphotransmitters (AHP), response regulators (ARR), biosynthesis (IPT).', db:'KEGG', org:'🌱', patterns:['ARR','AHK','AHP','IPT','CRE1','WOL','LOG','CKX'],  keyw:'ARR[0-9]|AHK[0-9]|AHP[0-9]|IPT'},
    {id:'aba',     name:'ABA Pathway',              desc:'ABA receptors (PYR/PYL), PP2C phosphatases, SnRK2 kinases, ABF TFs, NCED biosynthesis.', db:'KEGG', org:'🌱', patterns:['PYR','PYL','RCAR','PP2C','SnRK2','ABF','ABRE','NCED','ABI','LOS'],  keyw:'PYR|PYL|SnRK2|NCED|ABI[0-9]'},
    {id:'ethylene',name:'Ethylene Pathway',         desc:'ETR receptors, CTR1 kinase, EIN2/EIN3 signalling, ERF transcription factors.', db:'KEGG / PlantTFDB', org:'🌱', patterns:['ETR','CTR1','EIN','EIL','ERF','EBF','ACO','ACS','RAN'],  keyw:'ETR[0-9]|EIN[0-9]|ACO[0-9]|ACS[0-9]'},
    {id:'ja',      name:'Jasmonate Pathway (JA/JA-Ile)', desc:'JAZ repressors, COI1 receptor, MYC2 TF, LOX/AOC/OPR biosynthesis genes.', db:'KEGG / PlantTFDB', org:'🌱', patterns:['JAZ','JAI','COI1','MYC2','JMT','LOX','AOS','AOC','OPR','JAR'],  keyw:'JAZ[0-9]|COI1|MYC2|LOX[0-9]|OPR'},
    {id:'sa',      name:'Salicylic Acid Pathway',   desc:'NPR1 receptor, TGA TFs, PR proteins, ICS biosynthesis; systemic acquired resistance.', db:'KEGG / PlantTFDB', org:'🌱', patterns:['NPR1','TGA','PR','ICS','PAL','EDS','SID','SNI','SAR','WRKY'],  keyw:'NPR[12]|TGA[0-9]|PR[0-9]|ICS[12]'},
    {id:'br',      name:'Brassinosteroid Pathway',  desc:'BRI1/BAK1 receptors, BSK, BSU1, BIN2, BES1/BZR1 TFs; growth and stress signalling.', db:'KEGG / PlantTFDB', org:'🌱', patterns:['BRI1','BAK1','BSK','BSU','BIN','BES1','BZR','DWF','CPD','ROT'],  keyw:'BRI[12]|BAK1|BES1|BZR[12]|DWF'},
    {id:'sl',      name:'Strigolactone Pathway',    desc:'D14/KAI2 receptors, MAX2/D3 F-box, MAX1 biosynthesis, SMXLs, BRC1 branching control.', db:'KEGG', org:'🌱', patterns:['D14','KAI2','MAX','SMXL','BRC','D3','D17','D27','D53'],  keyw:'D14|MAX[0-9]|SMXL|BRC[12]'},
    {id:'ppe',     name:'Peptide Hormones (CLE/CLV/PSK)', desc:'Peptide hormone signalling: CLV3/WUS stem cell circuit, PSK cell proliferation, CLE root.', db:'PlantTFDB', org:'🌱', patterns:['CLE','CLV','WUS','PSK','PSKR','CEP','IDA','HAE','HSL'],  keyw:'CLE|CLV[123]|WUS|PSK'},
  ],
  defense_plant: [
    {id:'nbs_lrr', name:'NBS-LRR / NLR Resistance Genes', desc:'Intracellular immune receptors; TNL (TIR-NBS-LRR) and CNL (CC-NBS-LRR) classes.', db:'Pfam / PRGDB', org:'🌱', patterns:['NBS','LRR','NLR','TIR','CC-NBS','RPM1','RPS2','N','L6','Mi-1'],  keyw:'NBS|NLR|TIR-NBS|CC-NBS'},
    {id:'prp',     name:'PR Proteins (Pathogenesis-related)', desc:'PR-1 through PR-17 classes: chitinases, glucanases, thaumatin, defensins, lipid transfer.', db:'KEGG', org:'🌱', patterns:['PR1','PR2','PR3','PR4','PR5','PR6','PR7','PR8','PR10','PR12','PR17','BGL','CHI'],  keyw:'PR[0-9]|CHI[0-9]|BGL'},
    {id:'bak_rlk', name:'Pattern Recognition Receptors (PRR/LRR-RLK)', desc:'FLS2, EFR, BAK1 and co-receptors recognising PAMPs; surface immune receptors.', db:'Pfam', org:'🌱', patterns:['FLS2','EFR','BAK1','SOBIR','LYK','CERK','LecRK','PEPR','BIK1','PBS1'],  keyw:'FLS2|EFR|CERK[0-9]|LYK[0-9]'},
    {id:'wrky_def',name:'WRKY Defense Regulators',  desc:'Subset of WRKY TFs specifically regulating defense responses: WRKY33, WRKY38, WRKY70.', db:'PlantTFDB', org:'🌱', patterns:['WRKY11','WRKY18','WRKY22','WRKY29','WRKY33','WRKY38','WRKY40','WRKY60','WRKY70'],  keyw:'WRKY(11|18|22|29|33|38|40|60|70)'},
    {id:'pen',     name:'Penetration Resistance (PEN/PDR)', desc:'PEN1 SNARE, PEN2/PEN3 for callose and secondary metabolite accumulation at penetration sites.', db:'Pfam', org:'🌱', patterns:['PEN1','PEN2','PEN3','PDR','GTG','SNAP33','VAMP'],  keyw:'PEN[123]|PDR'},
    {id:'camta',   name:'ROS Scavenging Enzymes',   desc:'Reactive oxygen species detoxification: SOD, CAT, APX, GR, PRX, RBOH NADPH oxidases.', db:'Pfam', org:'🌱🐾', patterns:['SOD','CAT','APX','GR','GPX','PRX','RBOH','NADPH','FSD','MSD','CSD'],  keyw:'SOD|CAT[0-9]|APX|RBOH'},
  ],
  cellwall: [
    {id:'cesa',    name:'Cellulose Synthase (CESA/CSL)', desc:'CESA: primary and secondary cell wall cellulose synthesis. CSL: hemicellulose backbone.', db:'Pfam', org:'🌱', patterns:['CESA','CESAB','CSL','IRX','KOR','COBRA','CTL'],  keyw:'CESA[0-9]|CSL[A-Z]|IRX[0-9]'},
    {id:'exp',     name:'Expansins (EXPA/EXPB)',    desc:'Non-enzymatic cell wall loosening proteins enabling acid growth, organ formation, softening.', db:'Pfam', org:'🌱', patterns:['EXPA','EXPB','EXPLA','EXPLB','EXP','expansin'],  keyw:'EXPA|EXPB|EXPL'},
    {id:'xth',     name:'XTH / Xyloglucan Endotransglucosylase', desc:'Cut and ligate xyloglucan chains; cell wall assembly and modification.', db:'Pfam', org:'🌱', patterns:['XTH','XET','XEH','TCH4','MERI5'],  keyw:'XTH[0-9]'},
    {id:'pme',     name:'Pectin Methylesterase (PME/PMEI)', desc:'De-methylesterify pectin; cell adhesion, fruit softening, pathogen entry.', db:'Pfam', org:'🌱', patterns:['PME','PMEI','AtPME','OsPME'],  keyw:'PME[0-9]|PMEI'},
    {id:'pg',      name:'Polygalacturonases (PG)',  desc:'Pectin depolymerisation; fruit ripening, abscission, seed dispersal, pathogen infection.', db:'Pfam', org:'🌱', patterns:['PG','PGase','ADPG','AtPG','OsPG'],  keyw:'PG[0-9]|ADPG'},
    {id:'laq',     name:'Laccases / Lignin Biosynthesis', desc:'Oxidative polymerisation of monolignols; secondary cell wall lignification. Also PAL, CCR, CCoAOMT.', db:'Pfam', org:'🌱', patterns:['LAC','laccase','PAL','C4H','4CL','CCR','CAD','CCoAOMT','F5H','COMT'],  keyw:'LAC[0-9]|PAL|C4H|4CL|CCR'},
    {id:'csl',     name:'Hemicellulose Synthases (CSL/IRX)', desc:'Xylan, mannan, mixed-linkage glucan synthesis in Golgi; secondary cell wall formation.', db:'Pfam', org:'🌱', patterns:['IRX','GUX','GXM','TBL','CSLA','CSLC','CSLD','CSLE','IRX9','IRX14'],  keyw:'IRX[0-9]|GUX|CSL[A-E]'},
  ],
  photosynthesis: [
    {id:'psI',     name:'Photosystem I (PSI)',      desc:'PSI reaction centre and antenna proteins: psaA-psaL, LHCA1-4 light-harvesting complex I.', db:'Pfam / KEGG', org:'🌱', patterns:['PSA','LHCA','psaA','psaB','psaC','psaD','psaE'],  keyw:'PSA[A-L]|LHCA[1-4]'},
    {id:'psII',    name:'Photosystem II (PSII)',    desc:'PSII reaction centre and antenna: psbA-psbZ, LHCB1-6 (Cab genes), OEC (PsbO/P/Q).', db:'Pfam / KEGG', org:'🌱', patterns:['PSB','LHCB','psbA','psbB','psbD','CAB','OEC','PsbO','PsbP'],  keyw:'PSB[A-Z]|LHCB[1-6]|CAB[0-9]'},
    {id:'rubisco', name:'Rubisco / Calvin Cycle',  desc:'RbcS (small subunit), RbcL (large subunit), and CBC enzymes: FBA, FBP, SBP, PRK, TPI.', db:'Pfam / KEGG', org:'🌱', patterns:['RBCS','RBCL','SBP','FBA','FBP','TPI','PRK','PGK'],  keyw:'RBCS|RBCL|SBP|FBA[0-9]|FBP'},
    {id:'chlorodev',name:'Chloroplast Development', desc:'TOC/TIC translocon, GNC/GLK transcription, CHL biosynthesis, chloroplast division (FtsZ, ARC).', db:'Pfam', org:'🌱', patterns:['TOC','TIC','GNC','GLK','FtsZ','ARC','MinD','MinE','CHL','CHLD','CHLH'],  keyw:'TOC[0-9]|TIC[0-9]|GLK[12]|FtsZ'},
    {id:'photo_prot',name:'Photoprotection (NPQ/PsbS)', desc:'Non-photochemical quenching: PsbS, VDE, ZEP, ELIP proteins dissipate excess light energy.', db:'Pfam', org:'🌱', patterns:['PSBS','VDE','ZEP','ELIP','NPQ','LUT','VDX'],  keyw:'PSBS|VDE|ZEP|ELIP'},
    {id:'phy_cry',  name:'Photoreceptors (PHY/CRY/PHOT)', desc:'Phytochromes (PHYA-E), cryptochromes (CRY1/2), phototropins (PHOT1/2) light sensing.', db:'Pfam', org:'🌱', patterns:['PHY','CRY','PHOT','HY4','NPH','NPL','UVR8','FKF1'],  keyw:'PHY[A-E]|CRY[12]|PHOT[12]'},
  ],
  metabolism_plant: [
    {id:'cyp450',  name:'Cytochrome P450 (CYP)',   desc:'Largest enzyme superfamily; oxidation of diverse substrates: hormones, alkaloids, terpenes, fatty acids.', db:'KEGG / Pfam', org:'🌱🐾', patterns:['CYP','P450','CYP71','CYP76','CYP79','CYP80','CYP84','CYP85','CYP450'],  keyw:'CYP[0-9]'},
    {id:'ugt',     name:'UDP-Glucosyltransferases (UGT)', desc:'Glycosylation of secondary metabolites; anthocyanin, flavonol, hormone, and xenobiotic conjugation.', db:'Pfam', org:'🌱🐾', patterns:['UGT','UGD','UDPgluc','AtUGT','OsUGT'],  keyw:'UGT[0-9]'},
    {id:'tps',     name:'Terpene Synthases (TPS)',  desc:'Monoterpene, sesquiterpene, diterpene synthases; fragrance, defence, hormones, waxes.', db:'Pfam', org:'🌱', patterns:['TPS','terpene','kaurene','copalyl','TPSD','CPS','KSL','LIS','BIS'],  keyw:'TPS[0-9]|CPS[0-9]|KSL'},
    {id:'flavonoid',name:'Flavonoid / Anthocyanin Pathway', desc:'Chalcone synthase, flavonol synthase, ANS, DFR, F3H, F3\'H, F3\'5\'H, UFGT.', db:'Pfam / KEGG', org:'🌱', patterns:['CHS','CHI','FLS','F3H','DFR','ANS','ANR','UFGT','TT','TDS'],  keyw:'CHS|CHI|FLS|DFR|ANS|F3H'},
    {id:'glucosino',name:'Glucosinolate Biosynthesis', desc:'Plant defence compounds: CYP79A/B, CYP83A/B, GSTF, SOT, SUR, BCAT, MAM enzymes.', db:'KEGG', org:'🌱', patterns:['CYP79','CYP83','GSTF','SOT','SUR','BCAT','MAM','GS-OH','ESP'],  keyw:'CYP79|CYP83|MAM|SOT'},
    {id:'fatty_acid',name:'Fatty Acid Metabolism',  desc:'ACCase, KAS, FAD, FAE, SAD, FAB desaturases; seed oil biosynthesis and membrane lipids.', db:'KEGG', org:'🌱🐾', patterns:['FAD','FAE','KAS','ACC','FAS','SAD','FAB','DGAT','PDAT','LPAT'],  keyw:'FAD[0-9]|FAE[0-9]|DGAT|KAS[123]'},
    {id:'starch',  name:'Starch Biosynthesis',      desc:'AGPase (APL/APS), starch synthases (GBSS/SS), branching (SBE), debranching (ISA/PUL).', db:'KEGG', org:'🌱', patterns:['GBSS','APL','APS','SSI','SSII','SSIII','SBE','ISA','PUL','AGPase'],  keyw:'GBSS|APL|APS|SBE[0-9]|ISA[0-9]'},
  ],
  flowering: [
    {id:'flower_int',name:'Flowering Integrators (FT/SOC1)', desc:'FT florigen, SOC1, LFY, AP1: integrate photoperiod, vernalisation, autonomous pathway signals.', db:'PlantTFDB', org:'🌱', patterns:['FT','SOC1','LFY','AP1','FUL','CAL','SEP','FCA','FY','FLC','SVP'],  keyw:'FT|SOC1|LFY|FLC|SVP'},
    {id:'circ',    name:'Circadian Clock Genes',    desc:'CCA1, LHY, TOC1, PRR3/5/7/9, ELF3/4, GI, ZTL: oscillator components and clock outputs.', db:'PlantTFDB', org:'🌱', patterns:['CCA1','LHY','TOC1','PRR','ELF','GI','ZTL','BOA','PCL','LKP'],  keyw:'CCA1|LHY|TOC1|PRR[0-9]|GI|ZTL|ELF[34]'},
    {id:'vernaliz',name:'Vernalisation / FLC Pathway', desc:'FLC (floral repressor), FRI, VRN2 Polycomb, FLD, SDG27: cold-mediated flowering control.', db:'PlantTFDB', org:'🌱', patterns:['FLC','FRI','VRN','SDG','FLD','VIN3','PHD','ELF','MAF'],  keyw:'FLC|FRI|VRN[0-9]|MAF[0-9]'},
  ],
  root: [
    {id:'root_hair',name:'Root Hair Development (RSL/RHD)', desc:'RSL class I/II bHLH, RHD2/RBOHC, LRL, EXP7: root hair initiation and elongation.', db:'PlantTFDB', org:'🌱', patterns:['RSL','RHD','RBOHC','LRL','EXP7','RHS','TTG'],  keyw:'RSL[0-9]|RHD[0-9]'},
    {id:'root_arch',name:'Root Architecture (PLT/SCR/SHR)', desc:'PLT AP2 TFs, SCR/SHR GRAS: stem cell niche, quiescent centre, radial patterning.', db:'PlantTFDB', org:'🌱', patterns:['PLT','SCR','SHR','WOX','MGP','JKD','ACR','ARF','SLR'],  keyw:'PLT[0-9]|SCR|SHR'},
    {id:'lateral_root',name:'Lateral Root Initiation (ARF/IAA/LBD)', desc:'ARF7/ARF19, IAA14/IAA28, LBD16/18/29/33: lateral root founder cell specification.', db:'PlantTFDB', org:'🌱', patterns:['ARF7','ARF19','IAA14','IAA28','LBD16','LBD18','LBD29','LBD33','SLR1'],  keyw:'ARF7|ARF19|LBD(16|18|29|33)'},
    {id:'nod_myc',  name:'Nodulation / Mycorrhiza (NSP/RAM1)', desc:'NSP1/NSP2, NIN, ERN, RAM1, IPD3: symbiosis signalling for N-fixation and mycorrhiza.', db:'PlantTFDB', org:'🌱', patterns:['NSP','NIN','ERN','RAM1','IPD3','CSSP','SYM','SYMRK','NFR'],  keyw:'NSP[12]|NIN|ERN[0-9]|RAM1'},
  ],
  seed: [
    {id:'seed_stor',name:'Seed Storage Proteins',   desc:'11S globulins (legumin/cruciferin), 7S vicilin/phaseolin, 2S albumins, prolamins.', db:'Pfam', org:'🌱', patterns:['SEED','LEG','ARC','GLU','GLUAB','CRC','At2S','PHASEOLIN','VICILIN','ZEIN','GLUTEN'],  keyw:'LEG|ARC|GLU|ZEIN|GLUTEN'},
    {id:'seed_mat',  name:'Seed Maturation (LEC/ABI3/FUS3)', desc:'LEC1/LEC2, ABI3, FUS3 master regulators; DOG1 dormancy; seed desiccation tolerance.', db:'PlantTFDB', org:'🌱', patterns:['LEC1','LEC2','ABI3','FUS3','DOG1','AtEM','RAB','RLIP'],  keyw:'LEC[12]|ABI3|FUS3|DOG1'},
    {id:'lea',      name:'LEA / Dehydrin Proteins', desc:'Late embryogenesis abundant and dehydrin proteins; desiccation tolerance, cryoprotection.', db:'Pfam', org:'🌱', patterns:['LEA','DHN','dehydrin','RAB','AtEM','Cor','KS-type','ASR'],  keyw:'LEA|DHN[0-9]|dehydrin|RAB[0-9]'},
  ],
  gpcr: [
    {id:'gpcr_a',  name:'Class A GPCR (Rhodopsin)', desc:'Largest GPCR class: odorant, adrenergic, dopamine, serotonin, opioid, purinergic receptors.', db:'GPCRDB / Pfam', org:'🐾', patterns:['ADRB','ADRA','DRD','HTR','OPRM','OPRD','OPRK','ADORA','CXCR','CCR','P2RY'],  keyw:'ADRB[0-9]|DRD[0-9]|HTR[0-9]|CXCR'},
    {id:'gpcr_b',  name:'Class B GPCR (Secretin)',  desc:'Peptide hormone receptors: glucagon (GCGR), GLP-1R, PTH1R, CRHR, VIP/PACAP receptors.', db:'GPCRDB / Pfam', org:'🐾', patterns:['GCGR','GLP1R','GLP2R','PTH1R','PTH2R','CRHR','VIPR','CALCR'],  keyw:'GCGR|GLP[12]R|PTH[12]R|VIPR'},
    {id:'gpcr_c',  name:'Class C GPCR (Glutamate)', desc:'Metabotropic glutamate, GABA-B, calcium-sensing, sweet/umami taste receptors.', db:'GPCRDB', org:'🐾', patterns:['GRM','GABBR','CASR','T1R','TAS1R','GPRC6'],  keyw:'GRM[0-9]|GABBR[12]|CASR'},
    {id:'frizzled',name:'Frizzled / Wnt Receptors', desc:'Frizzled and Smoothened: Wnt and Hedgehog signalling co-receptors.', db:'GPCRDB', org:'🐾', patterns:['FZD','SMO','LRP5','LRP6','ROR2','RYK'],  keyw:'FZD[0-9]|SMO'},
    {id:'olfactory',name:'Olfactory Receptors (OR)', desc:'Largest mammalian gene family; ~400 functional OR genes in human, ~1000 in mouse.', db:'HORDE / Pfam', org:'🐾', patterns:['OR1','OR2','OR3','OR4','OR5','OR6','OR7','OR8','OR9','OR10','OR11','OR12','OR13'],  keyw:'OR[0-9][A-Z]'},
  ],
  nuclear_receptor: [
    {id:'steroid_r',name:'Steroid Hormone Receptors', desc:'ER, AR, PR, GR, MR: sex hormones, glucocorticoids, mineralocorticoids binding/signalling.', db:'NucleaRDB', org:'🐾', patterns:['ESR1','ESR2','AR','PGR','NR3C1','NR3C2','NR3C4'],  keyw:'ESR[12]|AR|PGR|NR3C[124]'},
    {id:'thyroid_r',name:'Thyroid / Retinoic Acid Receptors', desc:'THRA/THRB: thyroid hormone. RARA/B/G, RXRA/B/G: retinoid signalling.', db:'NucleaRDB', org:'🐾', patterns:['THRA','THRB','RARA','RARB','RARG','RXRA','RXRB','RXRG'],  keyw:'THR[AB]|RAR[ABG]|RXR[ABG]'},
    {id:'ppar',    name:'PPAR Family',               desc:'PPARα/γ/δ: lipid metabolism, adipogenesis, inflammation; therapeutic targets for diabetes.', db:'NucleaRDB', org:'🐾', patterns:['PPARA','PPARG','PPARD','PPARGC'],  keyw:'PPAR[AGD]'},
    {id:'nr_orphan',name:'Orphan Nuclear Receptors', desc:'LXR, FXR, CAR, PXR, SHP, ERR: bile acid, cholesterol, xenobiotic, mitochondrial metabolism.', db:'NucleaRDB', org:'🐾', patterns:['NR1H','NR1I','NR4A','NR5A','NURR','SF-1','LRH','LXR','FXR','PXR','CAR'],  keyw:'NR[0-9][A-Z][0-9]|LXR|FXR|PXR'},
  ],
  immune: [
    {id:'tlr',     name:'Toll-Like Receptors (TLR)', desc:'Pattern recognition receptors for PAMPs: LPS, flagellin, CpG DNA, dsRNA.', db:'KEGG / Pfam', org:'🐾', patterns:['TLR1','TLR2','TLR3','TLR4','TLR5','TLR6','TLR7','TLR8','TLR9'],  keyw:'TLR[0-9]'},
    {id:'nlr_a',   name:'NOD-like Receptors (NLR/NLRP)', desc:'Intracellular innate immune sensors; NLRP3 inflammasome, NOD1/NOD2 bacterial sensing.', db:'KEGG / Pfam', org:'🐾', patterns:['NLRP','NOD1','NOD2','NLRC','NALP','NAIP','CIITA','IPAF'],  keyw:'NLRP[0-9]|NOD[12]|NLRC[0-9]'},
    {id:'mhc',     name:'MHC / HLA Complex',         desc:'Major histocompatibility complex: antigen presentation to T cells; HLA-A/B/C/DR/DQ/DP.', db:'IMGT/HLA', org:'🐾', patterns:['HLA','MHC','H2','B2M','TAP1','TAP2','TAPBP'],  keyw:'HLA-[A-Z]|H2-[A-Z]'},
    {id:'ig',      name:'Immunoglobulins (BCR/antibodies)', desc:'B cell receptor and secreted antibody constant regions: IgH, IgK, IgL chains.', db:'IMGT', org:'🐾', patterns:['IGHG','IGHA','IGHM','IGHD','IGHE','IGKC','IGLC','IGKV','IGLV','IGHV'],  keyw:'IGH[GADME]|IGK[CV]|IGL[CV]'},
    {id:'tcr',     name:'T Cell Receptor (TCR)',      desc:'αβ and γδ TCR chains; VDJ recombination, thymic selection.', db:'IMGT', org:'🐾', patterns:['TRAC','TRBC','TRDC','TRGC','TRAV','TRBV','TRGV'],  keyw:'TR[ABGD][CV]'},
    {id:'cytokine',name:'Cytokines & Interleukins',   desc:'IL-1 through IL-38, TNF family, IFN-α/β/γ, CSF: intercellular immune communication.', db:'KEGG / Pfam', org:'🐾', patterns:['IL1','IL2','IL4','IL6','IL8','IL10','IL12','IL17','IL18','IL33','TNF','TNFSF','IFN','IFNA','IFNB','IFNG'],  keyw:'IL[0-9]+[AB]?|TNF|TNFSF[0-9]|IFN[ABG]'},
    {id:'chemokine',name:'Chemokines (CCL/CXCL)',    desc:'Small chemoattractant cytokines; leukocyte migration, angiogenesis, tumour microenvironment.', db:'KEGG', org:'🐾', patterns:['CCL','CXCL','XCL','CX3CL','CCR','CXCR'],  keyw:'CCL[0-9]+|CXCL[0-9]+'},
    {id:'complement',name:'Complement System',       desc:'C1-C9, factor B/D/H/I, properdin: innate immune lysis, opsonisation, inflammation.', db:'KEGG', org:'🐾', patterns:['C1Q','C1R','C1S','C2','C3','C4','C5','C6','C7','C8','C9','CFB','CFD','CFH','CFI','C3AR','C5AR'],  keyw:'C[0-9][QRS]?A?|CF[BDHI]'},
  ],
  signaling_animal: [
    {id:'wnt',     name:'Wnt / β-catenin Pathway',   desc:'WNT ligands, Frizzled receptors, LRP5/6, DVL, APC, GSK3β, β-catenin (CTNNB1), TCF/LEF.', db:'KEGG', org:'🐾', patterns:['WNT','FZD','LRP5','LRP6','DVL','APC','GSK3','CTNNB','AXIN','TCF','LEF'],  keyw:'WNT[0-9]|FZD[0-9]|DVL[0-9]|CTNNB'},
    {id:'notch',   name:'Notch Signalling Pathway',  desc:'NOTCH1-4, DLL, JAG ligands, ADAM10, NICD, RBPJ, HES/HEY targets; cell fate decisions.', db:'KEGG', org:'🐾', patterns:['NOTCH','DLL','JAG','MAML','RBPJ','HES','HEY','NRARP','ADAM10'],  keyw:'NOTCH[1-4]|DLL[0-9]|JAG[12]|HES[0-9]'},
    {id:'hedgehog',name:'Hedgehog Pathway',          desc:'SHH/IHH/DHH ligands, PTCH1/2, SMO, GLI1/2/3 TFs; embryonic patterning and cancer.', db:'KEGG', org:'🐾', patterns:['SHH','IHH','DHH','PTCH1','PTCH2','SMO','GLI1','GLI2','GLI3','SUFU'],  keyw:'SHH|IHH|PTCH[12]|SMO|GLI[123]'},
    {id:'tgfb',    name:'TGF-β / BMP Pathway',      desc:'TGF-β, BMP, ACTIVIN ligands; SMAD signalling; growth inhibition, EMT, bone morphogenesis.', db:'KEGG', org:'🐾', patterns:['TGFB','BMP','ACTIVIN','INHBA','SMAD','ALK','ACVR','BMPR','TGFBR'],  keyw:'TGFB[0-9]|BMP[0-9]|SMAD[0-9]|BMPR|TGFBR'},
    {id:'pi3k_akt',name:'PI3K / AKT / mTOR Pathway', desc:'Growth factor → PI3K → PIP3 → AKT → mTORC1; cell survival, metabolism, tumourigenesis.', db:'KEGG', org:'🐾', patterns:['PIK3','PTEN','AKT','MTOR','RPTOR','S6K','4EBP','PDK1','TSC1','TSC2'],  keyw:'PIK3[A-Z][A-Z]|AKT[123]|MTOR|TSC[12]'},
    {id:'ras_erk',  name:'RAS / ERK / MAPK Pathway', desc:'RAS-RAF-MEK-ERK cascade: proliferation, differentiation; frequently mutated in cancer.', db:'KEGG', org:'🐾', patterns:['KRAS','HRAS','NRAS','BRAF','RAF1','MAP2K1','MAP2K2','MAPK1','MAPK3','ERK','RSK','MNK'],  keyw:'KRAS|HRAS|NRAS|BRAF|MAP2K|MAPK[13]'},
    {id:'jak_stat',name:'JAK / STAT Pathway',       desc:'JAK1/2/3/TYK2 kinases → STAT1-6 TFs; cytokine receptor signalling, haematopoiesis.', db:'KEGG', org:'🐾', patterns:['JAK1','JAK2','JAK3','TYK2','STAT1','STAT2','STAT3','STAT4','STAT5','STAT6','SOCS'],  keyw:'JAK[123]|TYK2|STAT[0-9]|SOCS[0-9]'},
    {id:'nfkb_anim',name:'NF-κB / Inflammation',   desc:'IKK complex, IκB, NF-κB1/2, RELA/RELB; inflammatory cytokine production.', db:'KEGG', org:'🐾', patterns:['NFKB1','NFKB2','RELA','RELB','CHUK','IKBKB','IKBKG','NFKBIA','TNFAIP3','RIPK'],  keyw:'NFKB[12]|RELA|RELB|IKBK[BG]'},
    {id:'hippo',    name:'Hippo / YAP/TAZ Pathway', desc:'MST1/2, LATS1/2, MOB1, YAP1, TEAD; organ size control, stem cells, cancer.', db:'KEGG', org:'🐾', patterns:['STK3','STK4','LATS1','LATS2','MOB1','YAP1','WWTR1','TEAD','SAV1','NF2'],  keyw:'LATS[12]|YAP1|WWTR1|TEAD[0-9]'},
    {id:'dna_rep',  name:'DNA Damage Response',     desc:'ATM/ATR, CHK1/CHK2, BRCA1/2, RAD51, PARP1; genome integrity surveillance.', db:'KEGG', org:'🌱🐾', patterns:['ATM','ATR','BRCA1','BRCA2','RAD51','CHK1','CHEK1','CHEK2','PARP','TP53BP1','H2AX'],  keyw:'ATM|ATR|BRCA[12]|RAD51|PARP[0-9]'},
  ],
  ion_channel: [
    {id:'voltage_k',name:'Voltage-gated K⁺ Channels (KCN)', desc:'KCNA-KCNQ families; action potential repolarisation, neuronal excitability.', db:'Pfam', org:'🐾', patterns:['KCNA','KCNB','KCNC','KCND','KCNE','KCNF','KCNG','KCNH','KCNJ','KCNK','KCNQ'],  keyw:'KCN[A-Q][0-9]'},
    {id:'voltage_na',name:'Voltage-gated Na⁺ Channels (SCN)', desc:'SCN1A-SCN11A; fast depolarisation in neurons and muscle; pain, epilepsy targets.', db:'Pfam', org:'🐾', patterns:['SCN1A','SCN2A','SCN3A','SCN4A','SCN5A','SCN8A','SCN9A','SCN10A'],  keyw:'SCN[0-9]+A'},
    {id:'voltage_ca',name:'Voltage-gated Ca²⁺ Channels (CACN)', desc:'CACNA1A-CACNA1S; calcium entry for neurotransmission, muscle contraction, secretion.', db:'Pfam', org:'🐾', patterns:['CACNA1','CACNA2D','CACNB','CACNG','RYR','IP3R'],  keyw:'CACNA1[A-S]|CACNB[0-9]|RYR[123]'},
    {id:'lgic',    name:'Ligand-gated Ion Channels', desc:'GABA-A, nicotinic ACh, glutamate (NMDA/AMPA/kainate), serotonin 5-HT3, purinergic P2X.', db:'Pfam', org:'🐾', patterns:['GABRA','GABRB','GRIN','GRIA','GRIK','CHRNA','CHRNB','HTR3','P2RX'],  keyw:'GABR[AB]|GRIN[0-9]|GRIA[0-9]|P2RX'},
  ],
  ecm: [
    {id:'collagen',name:'Collagen Family',           desc:'28 types of collagen; structural ECM scaffold in connective tissues, cartilage, bone.', db:'Pfam', org:'🐾', patterns:['COL1','COL2','COL3','COL4','COL5','COL6','COL7','COL9','COL10','COL11','COL17','COL18'],  keyw:'COL[0-9]+[AB][012]?'},
    {id:'integrin',name:'Integrins',                 desc:'αβ heterodimers binding ECM ligands (fibronectin, laminin, collagen); adhesion, signalling.', db:'Pfam', org:'🐾', patterns:['ITGA','ITGB','integrin','ITGA1','ITGA2','ITGB1','ITGB3'],  keyw:'ITGA[0-9]+[A-Z]?|ITGB[0-9]'},
    {id:'mmp',     name:'Matrix Metalloproteinases (MMP)', desc:'ECM remodelling proteases: collagenases, gelatinases, stromelysins; invasion, angiogenesis.', db:'Pfam', org:'🐾', patterns:['MMP1','MMP2','MMP3','MMP7','MMP9','MMP13','MMP14','TIMP1','TIMP2','ADAM'],  keyw:'MMP[0-9]+|TIMP[0-9]|ADAM[0-9]'},
    {id:'laminin',  name:'Laminins / Fibronectin',   desc:'Laminin chains (LAMA/LAMB/LAMC) and fibronectin (FN1): basement membrane scaffolds.', db:'Pfam', org:'🐾', patterns:['LAMA','LAMB','LAMC','FN1','fibronectin','HAPLN','VCAN','AGC1'],  keyw:'LAMA[0-9]|LAMB[0-9]|LAMC[0-9]|FN1'},
  ],
  apoptosis: [
    {id:'bcl2',    name:'BCL-2 Family',              desc:'Anti-apoptotic (BCL2, BCL-XL, MCL1) and pro-apoptotic (BAX, BAK, BIM, PUMA) regulators.', db:'KEGG / Pfam', org:'🐾', patterns:['BCL2','BCLXL','BCL2L1','MCL1','BAX','BAK','BIM','BCL2L11','PUMA','BBC3','BID','NOXA','PMAIP1'],  keyw:'BCL2|BCL2L[0-9]+|MCL1|BAX|BAK[0-9]|PUMA|BBC3'},
    {id:'caspase', name:'Caspases',                  desc:'CASP1-12; initiator (CASP8/9) and executioner (CASP3/6/7) caspases; pyroptosis (CASP1/4/5/11).', db:'KEGG / Pfam', org:'🐾', patterns:['CASP1','CASP2','CASP3','CASP4','CASP5','CASP6','CASP7','CASP8','CASP9','CASP10'],  keyw:'CASP[0-9]+'},
    {id:'iap',     name:'IAP Family (Inhibitors of Apoptosis)', desc:'BIRC1-8; caspase inhibitors, NF-κB activators; survivin (BIRC5) is a major cancer target.', db:'Pfam', org:'🐾', patterns:['BIRC1','BIRC2','BIRC3','BIRC5','BIRC6','BIRC7','BIRC8','XIAP','survivin'],  keyw:'BIRC[0-9]|XIAP'},
    {id:'death_r', name:'Death Receptors (TNFR/FAS)', desc:'TNFR1, FAS/CD95, DR3/DR4/DR5/DR6, TRAIL receptors; extrinsic apoptosis pathway.', db:'KEGG', org:'🐾', patterns:['TNFRSF','FASL','TRAIL','TNFSF10','TNFRSF10','FAS','FADD','TRADD','RIPK1'],  keyw:'TNFRSF[0-9]+|FAS[LG]?|TNFSF10'},
  ],
  cancer: [
    {id:'oncogene',name:'Proto-oncogenes',           desc:'RAS, MYC, ERBB2, FOS, JUN, ABL, SRC, CCND1; mutated or overexpressed in tumours.', db:'KEGG / OncoKB', org:'🐾', patterns:['MYC','MYCN','ERBB2','KRAS','HRAS','SRC','ABL','FOS','JUN','CCND','CCNE','MDM2'],  keyw:'MYC[N]?|ERBB[0-9]|KRAS|HRAS|NRAS|ABL[12]|CCND[0-9]'},
    {id:'tumour_sup',name:'Tumour Suppressors',     desc:'TP53, RB1, PTEN, APC, VHL, CDKN2A, BRCA1/2, NF1/2; loss of function in cancer.', db:'KEGG / OncoKB', org:'🐾', patterns:['TP53','RB1','PTEN','APC','VHL','CDKN2A','CDKN1A','CDKN1B','NF1','NF2','WT1','MLH1'],  keyw:'TP53|RB1|PTEN|APC|CDKN[12][AB]|BRCA[12]|NF[12]'},
    {id:'cell_cycle_g',name:'Cell Cycle Regulation', desc:'Cyclins, CDKs, CDKi, CIP/KIP and INK4 inhibitors, RB, E2F: G1/S/G2/M checkpoints.', db:'KEGG', org:'🌱🐾', patterns:['CCNA','CCNB','CCND','CCNE','CDK1','CDK2','CDK4','CDK6','CDKN1A','CDKN1B','CDKN2A','E2F','RB1'],  keyw:'CCN[ABDE][0-9]|CDK[0-9]|CDKN[12][AB]|E2F[0-9]'},
    {id:'epi_cancer',name:'Epigenetic Cancer Genes', desc:'DNMT1/3, HDAC1-11, EZH2, KDM5C, KMT2A/2D; frequently mutated in haematological malignancies.', db:'KEGG', org:'🐾', patterns:['DNMT','HDAC','EZH','KDM','KMT','SETD','SMARCA','ARID','CREBBP','EP300'],  keyw:'DNMT[0-9]|HDAC[0-9]|EZH[12]|KDM[0-9]|SMARCA[0-9]'},
  ],
  epigenetic: [
    {id:'dna_meth',name:'DNA Methylation (DNMT/TET)', desc:'DNMT1/3A/3B methyltransferases, TET1/2/3 dioxygenases, MBD readers; epigenome programming.', db:'Pfam', org:'🌱🐾', patterns:['DNMT','TET1','TET2','TET3','MBD','MECP2','MBD1','CMT','DRM','MET','ROS'],  keyw:'DNMT[0-9]|TET[123]|MBD[0-9]|CMT[0-9]'},
    {id:'histone_mod',name:'Histone Modifiers (KMT/KDM/HAT/HDAC)', desc:'Writers (KMT), erasers (KDM, HDAC, SIRT), readers (bromodomain, chromodomain) of histone marks.', db:'Pfam', org:'🌱🐾', patterns:['KMT','KDM','HDAC','SIRT','HAT','KAT','EZH','SETD','NSD','DOT1','PRMT'],  keyw:'KMT[0-9]|KDM[0-9]|HDAC[0-9]|SIRT[0-9]|EZH[12]'},
    {id:'polycomb', name:'Polycomb / Trithorax Complex', desc:'PRC1/PRC2 repression (EZH2, EED, SUZ12, RING1) and Trithorax activation (KMT2A-D, SETD1).', db:'Pfam', org:'🌱🐾', patterns:['EZH','EED','SUZ12','RING1','BMI1','CBX','VRN2','CLF','SWN','ATML'],  keyw:'EZH[12]|EED|SUZ12|RING[12]|BMI1'},
    {id:'swi_snf', name:'SWI/SNF Chromatin Remodelling', desc:'BAF/PBAF complexes (SMARCA2/4, SMARCC1/2, ARID1A/B): gene activation and tumour suppression.', db:'Pfam', org:'🌱🐾', patterns:['SMARCA','SMARCC','SMARCD','SMARCE','ARID','BRG1','BRM','BAF','SNF','SWI'],  keyw:'SMARCA[0-9]|SMARCC[0-9]|ARID[0-9]|SNF[0-9]'},
  ],
  noncoding: [
    {id:'mirna',   name:'miRNA Biogenesis / AGO',   desc:'DROSHA, DGCR8, DICER, TARBP2, AGO1-4: small RNA processing and RISC assembly.', db:'miRBase / Pfam', org:'🌱🐾', patterns:['DROSHA','DGCR8','DICER','TARBP2','AGO','EIF2C','DCL','HEN1','HYL1','SGS3'],  keyw:'DROSHA|DICER|AGO[0-9]|DCL[0-9]'},
    {id:'lincrna', name:'lncRNA Biogenesis Factors', desc:'HNRNP, METTL3/14 (m6A), FTO, YTHDF, ADAR: lncRNA production, m6A modification, editing.', db:'Pfam', org:'🌱🐾', patterns:['METTL3','METTL14','WTAP','FTO','YTHDF','YTHDC','ALKBH','ADAR','HNRNP','ELAVL'],  keyw:'METTL[0-9]+|FTO|YTHDF[0-9]|ADAR[0-9]'},
  ],
  yeast_metabolism: [
    {id:'glycolysis',name:'Glycolysis / Gluconeogenesis', desc:'HXK, PGI, PFK, FBA, TDH, PGK, GPM, ENO, PYK, PDC, ADH: core carbon metabolism.', db:'SGD / KEGG', org:'🍞', patterns:['HXK','PGI','PFK','FBA','TDH','PGK','GPM','ENO','PYK','PDC','ADH','PCK','FBP'],  keyw:'HXK[12]|PFK[12]|TDH[123]|ADH[0-9]|ENO[12]'},
    {id:'tca',     name:'TCA / Krebs Cycle',          desc:'CIT1/2, ACO1/2, IDH1/2, KGD1/2, LSC1/2, SDH1-4, FUM1, MDH1/2/3: mitochondrial respiration.', db:'SGD / KEGG', org:'🍞', patterns:['CIT','ACO','IDH','KGD','LSC','SDH','FUM','MDH','PYC','MAE'],  keyw:'CIT[12]|IDH[12]|KGD[12]|SDH[1-4]'},
    {id:'yeast_aa', name:'Amino Acid Biosynthesis',    desc:'ARO, HIS, LEU, ILV, MET, CYS, TRP, LYS, ARG pathway genes; biosynthesis from precursors.', db:'SGD / KEGG', org:'🍞', patterns:['ARO','HIS','LEU','ILV','MET','CYS','TRP','LYS','ARG','SER','THR','CAN'],  keyw:'ARO[0-9]|HIS[0-9]|LEU[0-9]|ILV[0-9]'},
    {id:'yeast_lipid',name:'Lipid Metabolism (Yeast)',  desc:'FAS1/FAS2 fatty acid synthase, OLE1 desaturase, ACC1, PLC, INO, OPI, ARE, ERG sterols.', db:'SGD / KEGG', org:'🍞', patterns:['FAS1','FAS2','OLE1','ACC1','PLC','INO','OPI','ARE','ERG','PLB','CST'],  keyw:'FAS[12]|OLE1|ACC1|ERG[0-9]|OPI[0-9]'},
  ],
  yeast_stress: [
    {id:'yeast_hsp',name:'Yeast Heat Shock Response',  desc:'SSA (HSP70), SSB, HSP104, HSP82/HSC82 (HSP90), SSE, KAR2 (BiP): protein quality control.', db:'SGD', org:'🍞', patterns:['SSA','SSB','SSC','SSD','HSP104','HSP82','HSC82','SSE','KAR2','SSQ'],  keyw:'SSA[1-4]|SSB[12]|HSP104|HSP82|HSC82'},
    {id:'yeast_osm',name:'Yeast Osmotic Stress (HOG)',  desc:'HOG1 MAPK pathway: SHO1, SLN1, PBS2, HOG1, GPD1/2, GPP1/2 glycerol accumulation.', db:'SGD / KEGG', org:'🍞', patterns:['HOG1','PBS2','SHO1','SLN1','YPD1','SSK','GPD','GPP','STL1','AQY'],  keyw:'HOG1|PBS2|SHO1|SLN1|GPD[12]'},
    {id:'yeast_ox',  name:'Yeast Oxidative Stress',    desc:'Yap1 regulon: TRX1/2, TRR1/2, GRX1/2, SOD1/2, CTA1, CTT1, TSA1/2 peroxidases.', db:'SGD', org:'🍞', patterns:['YAP1','TRX','TRR','GRX','SOD1','SOD2','CTA1','CTT1','TSA','AHP1'],  keyw:'YAP1|TRX[12]|TRR[12]|GRX[12]|SOD[12]'},
    {id:'yeast_tor', name:'TOR / TORC1 Nutrient Sensing', desc:'TOR1/2, KOG1, LST8, TCO89, SCH9, NPR1, GCN2: nitrogen/carbon sensing, autophagy.', db:'SGD / KEGG', org:'🍞', patterns:['TOR1','TOR2','KOG1','LST8','TCO89','SCH9','NPR1','GCN2','ATG','VPS'],  keyw:'TOR[12]|KOG1|SCH9|ATG[0-9]'},
  ],
};

// ── SUBCATEGORY POPULATION ─────────────────────────────────────────────────
// ── GENE FAMILY — SCOPE TOGGLE ───────────────────────────────────────────
const gfScope = { whole: true, family: false };  // whole ON by default

function toggleScope(which) {
  gfScope[which] = !gfScope[which];
  const tile  = document.getElementById('gf-scope-' + which);
  const check = document.getElementById('gf-scope-check-' + which);
  if (tile)  tile.classList.toggle('active', gfScope[which]);
  if (check) check.textContent = gfScope[which] ? '✓' : '';

  // Show/hide family selector card
  const famSel = document.getElementById('gf-family-selector');
  if (famSel) famSel.style.display = gfScope.family ? '' : 'none';

  updateGFsummary();
}

// ── SELECT ALL CATS / FAMILIES ────────────────────────────────────────────
function selectAllCats(val) {
  document.querySelectorAll('#gf-cat-chips input[type=checkbox]')
    .forEach(cb => { cb.checked = val; });
  updateGFfamilyList();
}

function selectAllFamilies(val) {
  document.querySelectorAll('#gf-specific-list input[type=checkbox]')
    .forEach(cb => { cb.checked = val; });
  updateGFsummary();
}

// ── QUICK GROUP SELECT ────────────────────────────────────────────────────
const CAT_GROUPS = {
  plant:     ['hormone_plant','defense_plant','cellwall','photosynthesis','metabolism_plant','flowering'],
  animal:    ['immune','signaling_animal','apoptosis','cancer','epigenetic','gpcr'],
  yeast:     ['yeast_metabolism','yeast_stress'],
  universal: ['tf','kinase','phosphatase','transporter','ubiquitin','hsp','rrp','ribosomal']
};

function selectCatGroup(group) {
  const cats = CAT_GROUPS[group] || [];
  // First clear all, then check only this group's cats
  document.querySelectorAll('#gf-cat-chips input[type=checkbox]')
    .forEach(cb => { cb.checked = cats.includes(cb.value); });
  updateGFfamilyList();
}

// ── BUILD SPECIFIC FAMILY LIST ────────────────────────────────────────────
function updateGFfamilyList() {
  const checked = [...document.querySelectorAll('#gf-cat-chips input:checked')]
    .map(cb => cb.value);

  const panel   = document.getElementById('gf-specific-panel');
  const list    = document.getElementById('gf-specific-list');
  const counter = document.getElementById('gf-fam-counter');
  if (!list) return;

  if (checked.length === 0) {
    if (panel) panel.style.display = 'none';
    updateGFsummary();
    return;
  }

  // Preserve previously checked family IDs
  const prevChecked = new Set(
    [...document.querySelectorAll('#gf-specific-list input:checked')].map(cb => cb.value)
  );

  list.innerHTML = '';

  checked.forEach(cat => {
    const families = GF[cat] || [];
    if (!families.length) return;

    // Category header label
    const catLabel = document.querySelector('#gf-cat-chips input[value="' + cat + '"]')
      ?.parentElement?.textContent?.trim() || cat;
    const header = document.createElement('div');
    header.style.cssText = 'width:100%;font-size:0.68em;text-transform:uppercase;letter-spacing:0.8px;color:var(--purple);font-weight:700;margin:8px 0 4px;display:flex;align-items:center;gap:8px;';
    header.innerHTML = catLabel
      + '<span style="flex:1;height:1px;background:rgba(188,140,255,0.2);"></span>'
      + '<button onclick="selectCatFamilies(\'' + cat + '\',true)" style="background:none;border:none;font-size:1em;color:var(--text3);cursor:pointer;padding:0 4px;font-weight:400;text-transform:none;letter-spacing:0;">all</button>'
      + '<button onclick="selectCatFamilies(\'' + cat + '\',false)" style="background:none;border:none;font-size:1em;color:var(--text3);cursor:pointer;padding:0 4px;font-weight:400;text-transform:none;letter-spacing:0;">none</button>';
    list.appendChild(header);

    families.forEach(f => {
      const label = document.createElement('label');
      label.className = 'gf-fam-chip';
      const isChecked = prevChecked.size === 0 || prevChecked.has(f.id);
      label.innerHTML = '<input type="checkbox" value="' + f.id + '" data-cat="' + cat + '"'
        + (isChecked ? ' checked' : '') + ' onchange="updateGFsummary()"> ' + f.name;
      list.appendChild(label);
    });
  });

  if (panel) panel.style.display = '';
  updateGFsummary();
}

// Select / deselect all families within one category
function selectCatFamilies(cat, val) {
  document.querySelectorAll('#gf-specific-list input[data-cat="' + cat + '"]')
    .forEach(cb => { cb.checked = val; });
  updateGFsummary();
}

// ── UPDATE SUMMARY BOX ────────────────────────────────────────────────────
function updateGFsummary() {
  const summaryBox  = document.getElementById('gf-selection-summary');
  const summaryText = document.getElementById('gf-selection-text');
  const hintText    = document.getElementById('gf-scope-hint-text');
  const genLabel    = document.getElementById('gf-generate-label');
  const countBadge  = document.getElementById('gf-selected-count');
  const famCounter  = document.getElementById('gf-fam-counter');
  const filterLabel = document.getElementById('gf-filter-card-label');

  const selectedFamEls = [...document.querySelectorAll('#gf-specific-list input:checked')];
  const selectedFams   = selectedFamEls.map(cb => cb.parentElement.textContent.trim());
  const customRaw   = (document.getElementById('gf-custom-genes')?.value || '').trim();
  const customName  = (document.getElementById('gf-custom-name')?.value  || 'custom_list').trim() || 'custom_list';
  const hasCustom   = customRaw.length > 0;
  const customCount = hasCustom ? customRaw.split(/[\n,]+/).filter(g => g.trim()).length : 0;

  const doWhole  = gfScope.whole;
  const doFamily = gfScope.family;

  // Update family count badge
  if (countBadge) countBadge.textContent = selectedFams.length + ' ' + (selectedFams.length === 1 ? 'family' : 'families') + ' selected';

  // Live counter in specific panel
  if (famCounter) {
    if (selectedFams.length > 0) {
      famCounter.style.display = '';
      famCounter.innerHTML = '✅ <strong>' + selectedFams.length + ' ' + (selectedFams.length===1?'family':'families') + ' selected:</strong> '
        + selectedFams.slice(0,6).join(', ') + (selectedFams.length>6 ? ' + '+(selectedFams.length-6)+' more' : '');
    } else {
      famCounter.style.display = 'none';
    }
  }

  // Filter card label
  if (filterLabel && selectedFams.length > 0) {
    filterLabel.textContent = selectedFams.slice(0,3).join(', ') + (selectedFams.length>3 ? ' + '+(selectedFams.length-3)+' more' : '');
  }

  if (!doWhole && !doFamily && !hasCustom) {
    if (summaryBox) summaryBox.style.display = 'none';
    if (hintText)   hintText.textContent = 'Tick one or both options above to get started.';
    if (genLabel)   genLabel.textContent  = 'Select an analysis type above first.';
    return;
  }

  let parts = [], labelParts = [];

  if (doWhole) {
    parts.push('🔬 <strong>Whole analysis</strong> — DESeq2 on all genes, volcano plot, heatmap, PCA');
    labelParts.push('Whole analysis');
  }
  if (doFamily && selectedFams.length > 0) {
    const catCount = new Set(selectedFamEls.map(cb => cb.dataset.cat)).size;
    parts.push('🧬 <strong>' + selectedFams.length + ' gene ' + (selectedFams.length===1?'family':'families') + '</strong> across ' + catCount + ' ' + (catCount===1?'category':'categories') + ': '
      + selectedFams.slice(0,4).join(', ') + (selectedFams.length>4 ? ' + '+(selectedFams.length-4)+' more' : ''));
    labelParts.push(selectedFams.length + ' ' + (selectedFams.length===1?'family':'families'));
  } else if (doFamily && selectedFams.length === 0 && !hasCustom) {
    parts.push('🧬 <em style="color:var(--orange)">Gene Family Subset — tick at least one category and family above ↑</em>');
  }
  if (hasCustom) {
    parts.push('📋 <strong>Custom list</strong>: ' + customCount + ' genes (' + customName + ')');
    labelParts.push(customCount + ' custom genes');
  }

  if (summaryText) summaryText.innerHTML = parts.join('<br>');
  if (summaryBox)  summaryBox.style.display = parts.length ? '' : 'none';

  const allReady = doWhole || (doFamily && selectedFams.length > 0) || hasCustom;
  if (hintText) hintText.textContent = allReady
    ? '✅ Ready — click "Generate analysis code" to create your R scripts.'
    : (doFamily && selectedFams.length === 0)
      ? '⚠️ Gene Family Subset ticked — tick at least one category chip and one family below.'
      : 'Tick one or both options above.';

  if (genLabel) genLabel.textContent = labelParts.length
    ? labelParts.join(' + ') + ' — click to generate'
    : 'Select an analysis type above first.';
}

// ── GENERATE CODE ─────────────────────────────────────────────────────────
function generateGFcode() {
  const base  = document.getElementById('folder-preview-text')?.textContent || '~/Desktop/RNA-Seq_organism';
  const org   = val('cfg-org-tag', 'organism');   // needed for the GTF path
  const ctrl  = document.getElementById('cfg-ctrl')?.value  || 'control';
  const treat = document.getElementById('cfg-treat')?.value || 'treatment';
  const nCtrl  = document.querySelectorAll('#ctrl-rows input').length  || 3;
  const nTreat = document.querySelectorAll('#treat-rows input').length || 3;

  const doWhole  = gfScope.whole;
  const doFamily = gfScope.family;

  const selectedFamEls = [...document.querySelectorAll('#gf-specific-list input:checked')];
  const selectedFamIds = selectedFamEls.map(cb => ({ id: cb.value, cat: cb.dataset.cat }));
  const customRaw  = (document.getElementById('gf-custom-genes')?.value || '').trim();
  const customName = (document.getElementById('gf-custom-name')?.value || 'custom_list').trim() || 'custom_list';
  const hasCustom  = customRaw.length > 0;

  const codeSection = document.getElementById('gf-code-section');
  if (codeSection) codeSection.style.display = '';

  // ── Whole analysis code ──────────────────────────────────────────────
  const wholeCard = document.getElementById('gf-whole-card');
  if (wholeCard) wholeCard.style.display = doWhole ? '' : 'none';

  if (doWhole) {
    const ctrlCols  = Array(nCtrl).fill('"' + ctrl + '"').join(', ');
    const treatCols = Array(nTreat).fill('"' + treat + '"').join(', ');
    const nc = nCtrl + nTreat;
    const wholeCode = '# ─── Whole RNA-seq DESeq2 analysis ────────────────────────────────\nlibrary(DESeq2); library(ggplot2); library(pheatmap); library(ggrepel); library(dplyr)\nbase_path <- "' + base + '"\n\n# Load count matrix\ncounts_raw <- read.table(paste0(base_path, "/counts/gene_counts_all.txt"),\n                          header=TRUE, skip=1, row.names=1)\ncounts <- counts_raw[, (ncol(counts_raw)-' + (nc-1) + '):ncol(counts_raw)]\n\n# Sample metadata\nsample_info <- data.frame(\n  condition = factor(c(' + ctrlCols + ', ' + treatCols + ')),\n  row.names = colnames(counts)\n)\n\n# DESeq2\ndds <- DESeqDataSetFromMatrix(countData=counts, colData=sample_info, design=~condition)\ndds <- dds[rowSums(counts(dds)) >= 10, ]\ndds <- DESeq(dds)\nres <- results(dds, contrast=c("condition", "' + treat + '", "' + ctrl + '"), alpha=0.05)\nsummary(res)\n\nres_df <- as.data.frame(res); res_df$gene <- rownames(res_df)\nwrite.csv(res_df, paste0(base_path, "/results/deseq2_results_whole.csv"), row.names=FALSE)\n\n# Volcano\nres_plot <- res_df[!is.na(res_df$padj), ]\nres_plot$sig <- "NS"\nres_plot$sig[res_plot$padj<0.05 & res_plot$log2FoldChange>1]  <- "Up"\nres_plot$sig[res_plot$padj<0.05 & res_plot$log2FoldChange< -1] <- "Down"\np <- ggplot(res_plot, aes(log2FoldChange, -log10(padj), color=sig)) +\n  geom_point(alpha=0.6, size=1.5) +\n  scale_color_manual(values=c("Up"="#f0883e","Down"="#58a6ff","NS"="#6e7681")) +\n  geom_text_repel(data=filter(res_plot, padj<0.05) %>% arrange(padj) %>% head(15), aes(label=gene), size=3) +\n  geom_vline(xintercept=c(-1,1), linetype="dashed", alpha=0.5) +\n  geom_hline(yintercept=-log10(0.05), linetype="dashed", alpha=0.5) +\n  labs(title="Whole analysis: ' + treat + ' vs ' + ctrl + '", x="Log2 fold change", y="-Log10 padj") +\n  theme_minimal(base_size=13)\nggsave(paste0(base_path, "/results/volcano_whole.png"), plot=p, width=10, height=7, dpi=300)\n\n# Heatmap top 40\ntop40 <- res_df %>% filter(padj<0.05) %>% arrange(padj) %>% head(40) %>% pull(gene)\nif(length(top40) >= 3) {\n  vst_d <- vst(dds, blind=FALSE)\n  mat   <- t(scale(t(assay(vst_d)[top40, ])))\n  pheatmap(mat, cluster_rows=TRUE, cluster_cols=FALSE,\n    color=colorRampPalette(c("#58a6ff","white","#f0883e"))(100),\n    main="Top 40 DE genes: ' + treat + ' vs ' + ctrl + '",\n    filename=paste0(base_path, "/results/heatmap_whole.png"), width=9, height=12)\n}\ncat("Whole analysis complete!\\n")';
    set('gf-cmd-whole', wholeCode);
  }

  // ── Gene family filter + analysis ────────────────────────────────────
  const filterCard   = document.getElementById('gf-filter-card');
  const analysisCard = document.getElementById('gf-analysis-card');
  const plotsCard    = document.getElementById('gf-plots-card');
  const hasFamily = (doFamily && selectedFamIds.length > 0) || hasCustom;

  if (filterCard)   filterCard.style.display   = hasFamily ? '' : 'none';
  if (analysisCard) analysisCard.style.display = hasFamily ? '' : 'none';
  if (plotsCard)    plotsCard.style.display     = hasFamily ? '' : 'none';

  if (hasFamily) {
    // Collect all patterns from all selected families
    const allPatterns = [];
    const familyNames = [];
    const outputId    = selectedFamIds.map(f => f.id).join('_').slice(0, 40) || customName;

    selectedFamIds.forEach(({ id, cat }) => {
      const fam = (GF[cat] || []).find(f => f.id === id);
      if (fam) {
        familyNames.push(fam.name);
        fam.patterns.forEach(p => { if (!allPatterns.includes(p)) allPatterns.push(p); });
      }
    });
    if (hasCustom) familyNames.push(customName);

    const patternsR = allPatterns.map(p => '"' + p + '"').join(', ');
    const title     = familyNames.slice(0,3).join(' + ') + (familyNames.length>3 ? ' +...' : '');

    // Custom genes block
    const customLines = hasCustom
      ? customRaw.split(/[\n,]+/).map(g => g.trim()).filter(Boolean).map(g => '"' + g + '"').join(', ')
      : '';

    // ── Build the filter code ────────────────────────────────────────
    // Gene families are named by SYMBOL (MYB12, WRKY33), but a count matrix
    // is indexed by gene ID (ENSG…, AT1G01010, YAL001C). Matching patterns
    // straight against rownames therefore returned nothing for most
    // organisms. We now map IDs to symbols using the GTF this project has
    // already downloaded — exact, offline, and organism-agnostic.
    const filterCode = [
      '# ─── Filter to selected gene families ─────────────────────────',
      'library(DESeq2); library(dplyr)',
      'base_path <- "' + base + '"',
      'gtf_path  <- paste0(base_path, "/reference/' + org + '_annotation.gtf")',
      '',
      'counts_raw <- read.table(paste0(base_path, "/counts/gene_counts_all.txt"),',
      '                          header=TRUE, skip=1, row.names=1, check.names=FALSE)',
      'nc <- ncol(counts_raw)',
      'counts_full <- counts_raw[, (nc-' + (nCtrl+nTreat-1) + '):nc]',
      '',
      '# ── Map gene ID -> gene symbol from the GTF ──────────────────',
      '# Falls back to the IDs themselves when the GTF carries no gene_name.',
      'gene_symbol <- setNames(rownames(counts_full), rownames(counts_full))',
      'if (file.exists(gtf_path)) {',
      '  gl  <- readLines(gtf_path, warn=FALSE)',
      '  gl  <- gl[!startsWith(gl, "#")]',
      '  ids <- sub(\'.*gene_id "([^"]+)".*\', "\\\\1", gl)',
      '  nms <- ifelse(grepl(\'gene_name "\', gl),',
      '                sub(\'.*gene_name "([^"]+)".*\', "\\\\1", gl), NA_character_)',
      '  keep <- !is.na(nms) & ids != gl',
      '  if (any(keep)) {',
      '    map <- tapply(nms[keep], ids[keep], function(x) x[1])',
      '    hit <- intersect(names(map), rownames(counts_full))',
      '    gene_symbol[hit] <- unname(map[hit])',
      '    cat("Symbols recovered from GTF: ", length(hit), " / ", nrow(counts_full), "\\n")',
      '  } else {',
      '    cat("NOTE: this GTF has no gene_name attribute — matching on IDs.\\n")',
      '  }',
      '} else {',
      '  cat("NOTE: GTF not found at", gtf_path, "— matching on gene IDs only.\\n")',
      '}',
      '',
      '# Families selected: ' + familyNames.join(', ')
    ];

    if (allPatterns.length > 0) {
      filterCode.push(
        'family_tokens <- c(' + patternsR + ')',
        '# Anchored so a token matches a family member (MYB, MYB12, AtMYB12,',
        '# MYBL2) and NOT any gene that merely contains those letters',
        '# (AMYBEL1, POLYMYBASE). An optional 2-letter species prefix is',
        '# allowed; for unusual naming, paste explicit IDs in the custom box.',
        'species_prefix <- paste0("(At|Os|Zm|Ta|Gm|Sl|Bn|St|Vv|Nt|Ph|Cs|Gh|Hv|Sb|",',
        '                         "Bd|Mt|Pt|Ah|Ca|Le|Hs|Mm|Rn|Dr|Dm|Ce|Sc|Sp|Cr)?")',
        'pattern_regex <- paste0("^", species_prefix, "(",',
        '                        paste(family_tokens, collapse="|"),',
        '                        ")([A-Za-z]{0,2}[0-9][0-9A-Za-z._-]*)?$")',
        'genes_by_pattern <- rownames(counts_full)[',
        '  grepl(pattern_regex, gene_symbol, ignore.case=TRUE) |',
        '  grepl(pattern_regex, rownames(counts_full), ignore.case=TRUE)]',
        'cat("Matched by family pattern: ", length(genes_by_pattern), "\\n")'
      );
    }

    if (hasCustom) {
      filterCode.push(
        '',
        '# Custom gene list: ' + customName,
        'custom_genes <- c(' + customLines + ')',
        '# Accept either an ID or a symbol for each entry',
        'genes_custom <- rownames(counts_full)[',
        '  toupper(rownames(counts_full)) %in% toupper(custom_genes) |',
        '  toupper(gene_symbol)          %in% toupper(custom_genes)]',
        'missing_genes <- setdiff(toupper(custom_genes),',
        '                         toupper(c(rownames(counts_full)[',
        '                           rownames(counts_full) %in% genes_custom],',
        '                           gene_symbol[genes_custom])))',
        'if (length(missing_genes)) cat("Not found in count matrix: ",',
        '                               paste(missing_genes, collapse=", "), "\\n")'
      );
    }

    const sources = [];
    if (allPatterns.length > 0) sources.push('genes_by_pattern');
    if (hasCustom)              sources.push('genes_custom');

    filterCode.push(
      '',
      '# Combine all selected genes',
      'all_selected <- unique(c(' + sources.join(', ') + '))',
      'cat("Total genes in selection: ", length(all_selected), "\\n")',
      '',
      'counts_gf <- counts_full[rownames(counts_full) %in% all_selected, , drop=FALSE]',
      '# Label rows with symbols where we have them — plots become readable',
      'gf_labels <- gene_symbol[rownames(counts_gf)]',
      'cat("Genes retained in count matrix: ", nrow(counts_gf), "\\n")',
      'if (nrow(counts_gf) == 0) stop(',
      '  "No genes matched. Check that the GTF has gene_name attributes, or ",',
      '  "paste explicit gene IDs into the custom list box.")'
    );

    set('gf-cmd-filter', filterCode.join('\n'));

    const ctrlCols  = Array(nCtrl).fill('"' + ctrl + '"').join(', ');
    const treatCols = Array(nTreat).fill('"' + treat + '"').join(', ');

    const analysisCode = '# ─── DESeq2 on gene family subset ─────────────────────────────\n# Run the filter code above first!\n\nsample_info_gf <- data.frame(\n  condition = factor(c(' + ctrlCols + ', ' + treatCols + ')),\n  row.names = colnames(counts_gf)\n)\n\ndds_gf <- DESeqDataSetFromMatrix(countData=counts_gf, colData=sample_info_gf, design=~condition)\ndds_gf <- dds_gf[rowSums(counts(dds_gf)) >= 5, ]\ndds_gf <- DESeq(dds_gf)\n\nres_gf <- results(dds_gf, contrast=c("condition","' + treat + '","' + ctrl + '"), alpha=0.05)\nsummary(res_gf)\n\nres_gf_df <- as.data.frame(res_gf)\nres_gf_df$gene_id <- rownames(res_gf_df)\n# Label with the symbol recovered from the GTF, falling back to the ID\nres_gf_df$gene <- ifelse(is.na(gf_labels[rownames(res_gf_df)]),\n                         rownames(res_gf_df), gf_labels[rownames(res_gf_df)])\nwrite.csv(res_gf_df, paste0(base_path, "/results/' + outputId + '_results.csv"), row.names=FALSE)\ncat("Analysis complete: ' + title + '\\n")';
    set('gf-cmd-analysis', analysisCode);

    const plotsCode = '# ─── Plots for: ' + title + ' ─────────────────────────────────────\n# Run filter + analysis code above first!\n\n# ── Volcano ──\nres_p <- res_gf_df[!is.na(res_gf_df$padj), ]\nres_p$sig <- "NS"\nres_p$sig[res_p$padj<0.05 & res_p$log2FoldChange>1]  <- "Up"\nres_p$sig[res_p$padj<0.05 & res_p$log2FoldChange< -1] <- "Down"\n\np_gf <- ggplot(res_p, aes(log2FoldChange, -log10(padj), color=sig)) +\n  geom_point(alpha=0.7, size=2) +\n  scale_color_manual(values=c("Up"="#f0883e","Down"="#58a6ff","NS"="#6e7681")) +\n  geom_text_repel(data=filter(res_p,padj<0.05) %>% arrange(padj) %>% head(20), aes(label=gene), size=3) +\n  geom_vline(xintercept=c(-1,1), linetype="dashed", alpha=0.5) +\n  geom_hline(yintercept=-log10(0.05), linetype="dashed", alpha=0.5) +\n  labs(title="' + title + ': ' + treat + ' vs ' + ctrl + '",\n       subtitle=paste0(sum(res_p$sig=="Up")," up | ",sum(res_p$sig=="Down")," down"),\n       x="Log2 fold change", y="-Log10 padj") +\n  theme_minimal(base_size=13)\nggsave(paste0(base_path, "/results/' + outputId + '_volcano.png"), plot=p_gf, width=10, height=7, dpi=300)\n\n# ── Heatmap ──\ntop_genes <- res_gf_df %>% filter(padj<0.05) %>% arrange(padj) %>% head(40) %>% pull(gene)\nif(length(top_genes)>=3) {\n  vst_gf <- vst(dds_gf, blind=FALSE)\n  top_ids <- res_gf_df$gene_id[match(top_genes, res_gf_df$gene)]\n  mat_gf  <- t(scale(t(assay(vst_gf)[top_ids, ])))\n  rownames(mat_gf) <- top_genes\n  pheatmap(mat_gf, cluster_rows=TRUE, cluster_cols=FALSE,\n    color=colorRampPalette(c("#58a6ff","white","#f0883e"))(100),\n    main=paste0("' + title + ' — top significant genes"),\n    fontsize_row=8,\n    filename=paste0(base_path, "/results/' + outputId + '_heatmap.png"), width=9, height=12)\n  cat("Heatmap saved!\\n")\n} else { cat("Not enough significant genes for heatmap\\n") }\ncat("Plots saved to:", base_path, "/results/\\n")';
    set('gf-cmd-plots', plotsCode);
  }
}

