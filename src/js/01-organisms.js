// ── ORGANISM DATA ──────────────────────────────────────────────────────────
// Verified against Ensembl 116 / Ensembl Genomes 63 on 2026-08-24.
// Non-vertebrates hosted on ensembl.org (fly, worm, yeast) version their
// GTF with the Ensembl Genomes number, not the vertebrate release number.
const ENSEMBL_RELEASE = { vertebrates: 116, genomes: 63, checked: '2026-08-24' };

const ORG = {
  human:       {tag:'human', genome:'https://ftp.ensembl.org/pub/release-116/fasta/homo_sapiens/dna/Homo_sapiens.GRCh38.dna.primary_assembly.fa.gz', gtf:'https://ftp.ensembl.org/pub/release-116/gtf/homo_sapiens/Homo_sapiens.GRCh38.116.gtf.gz'},
  mouse:       {tag:'mouse', genome:'https://ftp.ensembl.org/pub/release-116/fasta/mus_musculus/dna/Mus_musculus.GRCm39.dna.primary_assembly.fa.gz', gtf:'https://ftp.ensembl.org/pub/release-116/gtf/mus_musculus/Mus_musculus.GRCm39.116.gtf.gz'},
  rat:         {tag:'rat', genome:'https://ftp.ensembl.org/pub/release-116/fasta/rattus_norvegicus/dna/Rattus_norvegicus.GRCr8.dna.toplevel.fa.gz', gtf:'https://ftp.ensembl.org/pub/release-116/gtf/rattus_norvegicus/Rattus_norvegicus.GRCr8.116.gtf.gz'},
  zebrafish:   {tag:'zebrafish', genome:'https://ftp.ensembl.org/pub/release-116/fasta/danio_rerio/dna/Danio_rerio.GRCz11.dna.primary_assembly.fa.gz', gtf:'https://ftp.ensembl.org/pub/release-116/gtf/danio_rerio/Danio_rerio.GRCz11.116.gtf.gz'},
  fly:         {tag:'drosophila', genome:'https://ftp.ensembl.org/pub/release-116/fasta/drosophila_melanogaster/dna/Drosophila_melanogaster.BDGP6.54.dna.toplevel.fa.gz', gtf:'https://ftp.ensembl.org/pub/release-116/gtf/drosophila_melanogaster/Drosophila_melanogaster.BDGP6.54.63.gtf.gz'},
  worm:        {tag:'celegans', genome:'https://ftp.ensembl.org/pub/release-116/fasta/caenorhabditis_elegans/dna/Caenorhabditis_elegans.WBcel235.dna.toplevel.fa.gz', gtf:'https://ftp.ensembl.org/pub/release-116/gtf/caenorhabditis_elegans/Caenorhabditis_elegans.WBcel235.63.gtf.gz'},
  yeast:       {tag:'yeast', genome:'https://ftp.ensembl.org/pub/release-116/fasta/saccharomyces_cerevisiae/dna/Saccharomyces_cerevisiae.R64-1-1.dna.toplevel.fa.gz', gtf:'https://ftp.ensembl.org/pub/release-116/gtf/saccharomyces_cerevisiae/Saccharomyces_cerevisiae.R64-1-1.63.gtf.gz'},
  yarrowia:    {tag:'yarrowia', genome:'https://ftp.ensemblgenomes.ebi.ac.uk/pub/fungi/release-63/fasta/yarrowia_lipolytica/dna/Yarrowia_lipolytica.GCA_000002525.1.dna.toplevel.fa.gz', gtf:'https://ftp.ensemblgenomes.ebi.ac.uk/pub/fungi/release-63/gtf/yarrowia_lipolytica/Yarrowia_lipolytica.GCA_000002525.1.63.gtf.gz'},
  arabidopsis: {tag:'arabidopsis', genome:'https://ftp.ensemblgenomes.ebi.ac.uk/pub/plants/release-63/fasta/arabidopsis_thaliana/dna/Arabidopsis_thaliana.TAIR10.dna.toplevel.fa.gz', gtf:'https://ftp.ensemblgenomes.ebi.ac.uk/pub/plants/release-63/gtf/arabidopsis_thaliana/Arabidopsis_thaliana.TAIR10.63.gtf.gz'},
  maize:       {tag:'maize', genome:'https://ftp.ensemblgenomes.ebi.ac.uk/pub/plants/release-63/fasta/zea_mays/dna/Zea_mays.Zm-B73-REFERENCE-NAM-5.0.dna.toplevel.fa.gz', gtf:'https://ftp.ensemblgenomes.ebi.ac.uk/pub/plants/release-63/gtf/zea_mays/Zea_mays.Zm-B73-REFERENCE-NAM-5.0.63.gtf.gz'},
  rice:        {tag:'rice', genome:'https://ftp.ensemblgenomes.ebi.ac.uk/pub/plants/release-63/fasta/oryza_sativa/dna/Oryza_sativa.IRGSP-1.0.dna.toplevel.fa.gz', gtf:'https://ftp.ensemblgenomes.ebi.ac.uk/pub/plants/release-63/gtf/oryza_sativa/Oryza_sativa.IRGSP-1.0.63.gtf.gz'},
  wheat:       {tag:'wheat', genome:'https://ftp.ensemblgenomes.ebi.ac.uk/pub/plants/release-63/fasta/triticum_aestivum/dna/Triticum_aestivum.IWGSC.dna.toplevel.fa.gz', gtf:'https://ftp.ensemblgenomes.ebi.ac.uk/pub/plants/release-63/gtf/triticum_aestivum/Triticum_aestivum.IWGSC.63.gtf.gz'},
  soybean:     {tag:'soybean', genome:'https://ftp.ensemblgenomes.ebi.ac.uk/pub/plants/release-63/fasta/glycine_max/dna/Glycine_max.Glycine_max_v2.1.dna.toplevel.fa.gz', gtf:'https://ftp.ensemblgenomes.ebi.ac.uk/pub/plants/release-63/gtf/glycine_max/Glycine_max.Glycine_max_v2.1.63.gtf.gz'},
  tomato:      {tag:'tomato', genome:'https://ftp.ensemblgenomes.ebi.ac.uk/pub/plants/release-63/fasta/solanum_lycopersicum_gca000188115v5cm/dna/Solanum_lycopersicum_gca000188115v5cm.SL4.0.dna.toplevel.fa.gz', gtf:'https://ftp.ensemblgenomes.ebi.ac.uk/pub/plants/release-63/gtf/solanum_lycopersicum_gca000188115v5cm/Solanum_lycopersicum_gca000188115v5cm.SL4.0.63.gtf.gz'},
  custom:      {tag:'',genome:'',gtf:''}
};

function applyOrganism() {
  const key = document.getElementById('cfg-organism').value;
  const o = ORG[key];
  if (o.tag) document.getElementById('cfg-org-tag').value = o.tag;
  if (o.genome) document.getElementById('cfg-genome-url').value = o.genome;
  if (o.gtf) document.getElementById('cfg-gtf-url').value = o.gtf;
  updateAll();
}

