# Defender detection evidence

Window start : 2026-09-07T20:52:18.8437898Z
Collected at : 2026-09-07T20:53:31.7751276Z
Machine      : MKT-PHASE5-CLEA
RealTimeProtection=True BehaviorMonitor=True Engine=1.1.26080.3 Signatures=1.459.99.0

## Threat detections (Get-MpThreatDetection)

None in window.

## Defender Operational log (1116 detected / 1117 actioned)

None in window. If Get-MpThreatDetection also showed none, the installer ran without a detection.

## Reading this

The Path and Process Name fields decide the next change:
  - a Temp path with an NSIS plugin directory in it means a staged script tripped it
  - which stage follows from the script name in that path
  - powershell.exe as Process Name with a \Temp\ path is the stager shape itself,
    not any one script content, which would mean relocating the scripts out of temp
    rather than editing them
