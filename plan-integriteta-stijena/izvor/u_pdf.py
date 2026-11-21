"""Pretvara DOCX u PDF putem LibreOffice-a uz ažuriranje sadržaja (TOC) i polja.
Upotreba: python3 u_pdf.py ulaz.docx izlaz.pdf"""
import os, subprocess, sys, time
import uno
from com.sun.star.beans import PropertyValue

def pv(name, value):
    p = PropertyValue(); p.Name = name; p.Value = value; return p

src, dst = os.path.abspath(sys.argv[1]), os.path.abspath(sys.argv[2])
port = 2002 + os.getpid() % 1000
prof = f"file:///tmp/lo_profile_{os.getpid()}"
proc = subprocess.Popen(["soffice", "--headless", "--invisible", "--norestore", f"-env:UserInstallation={prof}",
                         f"--accept=socket,host=127.0.0.1,port={port};urp;"], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
ctx = None
local = uno.getComponentContext()
resolver = local.ServiceManager.createInstanceWithContext("com.sun.star.bridge.UnoUrlResolver", local)
for _ in range(60):
    try:
        ctx = resolver.resolve(f"uno:socket,host=127.0.0.1,port={port};urp;StarOffice.ComponentContext"); break
    except Exception:
        time.sleep(0.5)
desktop = ctx.ServiceManager.createInstanceWithContext("com.sun.star.frame.Desktop", ctx)
doc = desktop.loadComponentFromURL(uno.systemPathToFileUrl(src), "_blank", 0, (pv("Hidden", True),))
for _ in range(2):
    idx = doc.getDocumentIndexes()
    for i in range(idx.getCount()):
        idx.getByIndex(i).update()
    doc.getTextFields().refresh()
doc.storeToURL(uno.systemPathToFileUrl(dst), (pv("FilterName", "writer_pdf_Export"),))
doc.close(True)
try:
    desktop.terminate()
except Exception:
    pass
proc.wait(timeout=30)
print("PDF:", dst)
