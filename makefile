
ZIPCOMMAND := zip
FILESINZIP = main.html main.js manifest.json LICENSE README.md icon.png
ZIPNAME = SilenceOfTheTabs

all: $(ZIPNAME).zip

$(ZIPNAME).zip : $(FILESINZIP) FORCE
	mkdir -p build/$(ZIPNAME)
	cp $(FILESINZIP) build/$(ZIPNAME)
	cd build && zip -r $(ZIPNAME).zip $(ZIPNAME)
	rm -r build/$(ZIPNAME)
	mv build/$(ZIPNAME).zip $(ZIPNAME).zip
	rmdir build
	unzip -l $(ZIPNAME).zip

FORCE:
