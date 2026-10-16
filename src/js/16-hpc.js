// ── HPC SCRIPT WRAPPER ────────────────────────────────────────────────────
function wrapHPC(cmdBody, stepName) {
  const name      = (document.getElementById('hpc-jobname')?.value  || 'rnaflow').trim();
  const cpus      = (document.getElementById('hpc-cpus')?.value     || '8').trim();
  const mem       = (document.getElementById('hpc-mem')?.value      || '32').trim();
  const hrs       = (document.getElementById('hpc-time')?.value     || '24').trim();
  const partition = (document.getElementById('hpc-partition')?.value || 'normal').trim();
  const email     = (document.getElementById('hpc-email')?.value    || '').trim();
  const jobname   = name + '_' + stepName;
  const base      = document.getElementById('folder-preview-text')?.textContent || '~/rnaseq';
  const NL        = '\n';

  if (currentEnv === 'slurm') {
    let hdr  = '#!/bin/bash' + NL;
    hdr += '#SBATCH --job-name=' + jobname + NL;
    hdr += '#SBATCH --cpus-per-task=' + cpus + NL;
    hdr += '#SBATCH --mem=' + mem + 'G' + NL;
    hdr += '#SBATCH --time=' + hrs + ':00:00' + NL;
    hdr += '#SBATCH --partition=' + partition + NL;
    hdr += '#SBATCH --output=' + base + '/logs/' + stepName + '_%j.out' + NL;
    hdr += '#SBATCH --error='  + base + '/logs/' + stepName + '_%j.err';
    if (email) { hdr += NL + '#SBATCH --mail-type=END,FAIL' + NL + '#SBATCH --mail-user=' + email; }
    hdr += NL + NL + '# Activate conda environment' + NL;
    hdr += 'source ~/.bashrc 2>/dev/null' + NL;
    hdr += 'conda activate rnaseq 2>/dev/null' + NL + NL;
    hdr += '# Commands' + NL;
    hdr += cmdBody;
    hdr += NL + NL + '# Submit with: sbatch ' + stepName + '.sh';
    return hdr;
  }
  if (currentEnv === 'pbs') {
    let hdr  = '#!/bin/bash' + NL;
    hdr += '#PBS -N ' + jobname + NL;
    hdr += '#PBS -l nodes=1:ppn=' + cpus + NL;
    hdr += '#PBS -l mem=' + mem + 'gb' + NL;
    hdr += '#PBS -l walltime=' + hrs + ':00:00' + NL;
    hdr += '#PBS -q ' + partition + NL;
    hdr += '#PBS -o ' + base + '/logs/' + stepName + '.out' + NL;
    hdr += '#PBS -e ' + base + '/logs/' + stepName + '.err';
    if (email) { hdr += NL + '#PBS -m ae' + NL + '#PBS -M ' + email; }
    hdr += NL + NL + '# Activate conda environment' + NL;
    hdr += 'source ~/.bashrc 2>/dev/null' + NL;
    hdr += 'conda activate rnaseq 2>/dev/null' + NL;
    hdr += 'cd $PBS_O_WORKDIR' + NL + NL;
    hdr += '# Commands' + NL;
    hdr += cmdBody;
    hdr += NL + NL + '# Submit with: qsub ' + stepName + '.sh';
    return hdr;
  }
  if (currentEnv === 'lsf') {
    let hdr  = '#!/bin/bash' + NL;
    hdr += '#BSUB -J ' + jobname + NL;
    hdr += '#BSUB -n ' + cpus + NL;
    hdr += '#BSUB -M ' + (parseInt(mem) * 1000) + NL;
    hdr += '#BSUB -W ' + hrs + ':00' + NL;
    hdr += '#BSUB -q ' + partition + NL;
    hdr += '#BSUB -o ' + base + '/logs/' + stepName + '_%J.out' + NL;
    hdr += '#BSUB -e ' + base + '/logs/' + stepName + '_%J.err';
    if (email) { hdr += NL + '#BSUB -N' + NL + '#BSUB -u ' + email; }
    hdr += NL + NL + '# Activate conda environment' + NL;
    hdr += 'source ~/.bashrc 2>/dev/null' + NL;
    hdr += 'conda activate rnaseq 2>/dev/null' + NL + NL;
    hdr += '# Commands' + NL;
    hdr += cmdBody;
    hdr += NL + NL + '# Submit with: bsub < ' + stepName + '.sh';
    return hdr;
  }
  return cmdBody;
}

function wrapCloud(cmdBody, stepName) {
  const dataPath = (document.getElementById('cloud-data-path')?.value || '').trim();
  const outPath  = (document.getElementById('cloud-out-path')?.value  || '').trim();
  const workDir  = (document.getElementById('cloud-work-dir')?.value  || '~/rnaseq').trim();
  const NL = '\n';
  const cmds = {
    aws:   { pull: dataPath ? 'aws s3 sync "' + dataPath + '" "' + workDir + '/raw_data/" --only-show-errors' : '',
             push: outPath  ? 'aws s3 sync "' + workDir + '/results/" "' + outPath + '" --only-show-errors' : '' },
    gcp:   { pull: dataPath ? 'gsutil -m rsync -r "' + dataPath + '" "' + workDir + '/raw_data/"' : '',
             push: outPath  ? 'gsutil -m rsync -r "' + workDir + '/results/" "' + outPath + '"' : '' },
    azure: { pull: dataPath ? 'azcopy sync "' + dataPath + '" "' + workDir + '/raw_data/" --recursive' : '',
             push: outPath  ? 'azcopy sync "' + workDir + '/results/" "' + outPath + '" --recursive' : '' }
  };
  const s = cmds[currentEnv] || { pull: '', push: '' };
  let out = '';
  if (s.pull) out += '# Pull data from cloud storage' + NL + s.pull + NL + NL;
  out += cmdBody;
  if (s.push) out += NL + NL + '# Push results to cloud storage' + NL + s.push;
  return out;
}

function envWrap(cmdBody, stepName) {
  if (currentEnv === 'local') return cmdBody;
  if (['slurm','pbs','lsf'].includes(currentEnv)) return wrapHPC(cmdBody, stepName);
  if (['aws','gcp','azure'].includes(currentEnv)) return wrapCloud(cmdBody, stepName);
  return cmdBody;
}

