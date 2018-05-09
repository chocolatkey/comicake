import O from "./O";

//==============================================================================================================================================
//----------------------------------------------------------------------------------------------------------------------------------------------

//-- Book

//----------------------------------------------------------------------------------------------------------------------------------------------


let B = {}; // Bibi.Book


B.initialize = function() {
    O.applyTo(B, {
        Title: "",
        Creator: "",
        Publisher: "",
        Language: "",
        WritingMode: "",
        Unzipped: false,
        Path: "",
        PathDelimiter: "",
        Mimetype:  { Path: "mimetype" },
        Container: { Path: "META-INF/container.xml" },
        Package:   { Path: "", Dir: "",
            Metadata: { "identifier": "", "title": "", "creators": [], "publishers": [], "languages": [] },
            Manifest: { "items": {}, "nav": {}, "toc-ncx": {}, "cover-image": {}, Files: {} },
            Spine:    { "itemrefs": [] }
        },
        Files: {},
        FileDigit: 0
    });
};

export default B;