SOLANA LOCAL EXPLORER — CAPSTONE SUBMISSION
BITS Pilani · B.Sc. Computer Science · 2025-2026
Garvit Dadheech · Shubh Kesharwani · Supervisor: Dharma Teja

START HERE
    00_Submission_Index.pdf
        One page per deliverable, plus a table mapping every submission
        requirement to the file that answers it.

CONTENTS
    00_Submission_Index.pdf                     index and requirement map
    01_Project_Report.pdf                       final documentation (61 pp)
                                                -> page 2 is the certificate
                                                   page for supervisor signature
    02_Project_Summary.pdf                      pre-viva summary, UVP (9 pp)
    03_Code_Submission/                         source archive (zip, 1.0 MB)
    04_Source_Code_Link.txt                     GitHub link and access notes
    05_User_Manual.pdf                          user manual (20 pp)
    06_Installation_Guide.pdf                   installation guide (13 pp)
    07_Test_Cases_and_Validation_Report.pdf     92 test cases + results (16 pp)
    08_Final_Presentation.pptx                  BITS template deck (14 slides)
    _source/                                    reproducible build sources for
                                                the documents above

BEFORE SUBMITTING
    1. Print page 2 of 01_Project_Report.pdf, have the supervisor sign and
       date it, and scan it back in or attach the signed page. The viva
       cannot be conducted without a signed report.
    2. If the GitHub repository is private, fill in the two evaluator
       usernames in 04_Source_Code_Link.txt and grant them read access —
       or make the repository public.

RUN THE PROJECT
    git clone https://github.com/shubhiscoding/Solana-Local-Indexer-Explorer.git
    cd Solana-Local-Indexer-Explorer
    docker compose up --build -d
    open http://localhost:3000

RUN THE TESTS (no Docker needed)
    cd explorer && pnpm install && pnpm test      ->  9 passed (9)
    cd indexer  && pnpm install && pnpm test      -> 29 passed (29)

Last updated: 28 August 2026
