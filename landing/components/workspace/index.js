(() => {
  "use strict";

  const story = window.SplitSlateStory;

  // Original single-line glyphs: real strokes, not a text element revealed by a rectangle.
  // Separate paths represent pen lifts. The timeline also follows these exact paths with the nib.
  const GLYPHS = {
    a: ["M13 10Q5 6 3 14Q1 23 8 21Q13 19 13 10L12 22L16 20"],
    b: ["M4 2L2 22L4 12Q12 5 15 13Q18 22 5 22"],
    c: ["M15 11Q8 5 3 13Q-1 24 13 21"],
    d: ["M13 11Q4 6 2 15Q0 24 9 21L13 15", "M15 1L12 22L16 21"],
    e: ["M3 15Q18 16 13 9Q5 4 2 15Q0 25 15 21"],
    f: ["M4 29L8 5Q10-2 16 2", "M2 12L15 10"],
    g: ["M14 11Q4 6 2 16Q0 24 10 20L14 10L12 27Q10 34 2 29"],
    h: ["M4 1L2 22L4 14Q15 2 14 15L13 22L17 21"],
    i: ["M5 11L3 21L8 21", "M6 4L6 5"],
    j: ["M9 10L6 27Q3 34-2 29", "M10 4L10 5"],
    k: ["M5 1L2 22", "M15 9L3 17L14 23"],
    l: ["M7 1L3 20Q3 23 10 21"],
    m: ["M2 22L4 10L4 16Q10 5 11 12L10 21Q18 4 20 12L19 22L23 21"],
    n: ["M2 22L4 10L4 16Q15 3 15 14L14 22L18 21"],
    o: ["M12 9Q3 5 2 15Q0 24 10 22Q18 20 15 12L12 9"],
    p: ["M2 29L5 10L4 18Q4 5 14 10Q21 18 5 22"],
    q: ["M14 10Q3 6 2 15Q0 24 10 21L14 10L11 29L16 27"],
    r: ["M2 22L5 10L4 16Q10 6 16 11"],
    s: ["M15 10Q7 5 3 11Q0 15 10 16Q19 19 9 23L1 21"],
    t: ["M8 3L5 19Q3 25 13 21", "M1 11L16 9"],
    u: ["M4 10L2 18Q1 25 9 21L15 11L13 22L18 21"],
    v: ["M2 10L6 23L17 10"],
    w: ["M2 10L3 22L12 10L13 22L23 10"],
    x: ["M3 10L14 22", "M16 9L1 23"],
    y: ["M3 10L3 18Q3 24 12 17L16 10L10 28Q6 35 0 29"],
    z: ["M2 11L17 9L1 22L17 21"],
    0: ["M11 2Q3 0 2 13Q0 26 10 24Q18 23 18 10Q18 1 11 2"],
    1: ["M3 7L11 2L9 24", "M3 25L16 24"],
    2: ["M2 7Q7-1 14 3Q23 10 3 24L19 24"],
    3: ["M3 4Q20-1 16 8L9 12Q24 11 17 22Q12 28 1 22"],
    4: ["M12 2L1 17L20 16", "M15 7L13 25"],
    5: ["M20 2L5 3L3 13Q18 6 18 18Q16 29 1 22"],
    6: ["M17 2Q5 0 2 17Q0 28 12 24Q23 16 12 12L2 16"],
    7: ["M2 3L21 2L7 25"],
    8: ["M11 12Q-3 4 9 1Q22-1 18 7L11 12Q-4 21 7 25Q24 28 20 18L11 12"],
    9: ["M18 12Q18 0 7 2Q-4 7 4 13Q9 17 18 10L14 25"],
    $: ["M18 5Q9-1 4 6Q0 11 13 14Q25 18 16 24Q8 29 0 21", "M13-3L8 30"],
    "+": ["M1 13L20 12", "M11 3L10 23"],
    "-": ["M1 14L20 12"],
    "=": ["M1 9L20 8", "M1 17L20 16"],
    "/": ["M18 0L2 28"],
    "?": ["M2 7Q3-2 13 1Q23 6 14 13L9 17L9 20", "M9 27L9 28"],
  };

  const handwriting = (text, x, y, size, start, end, extra = "") => {
    const scale = size / 28;
    const letters = [...text.toLowerCase()];
    const count = letters.reduce((sum, letter) => sum + (GLYPHS[letter]?.length || 0), 0);
    let cursor = x;
    let stroke = 0;
    const markup = letters
      .map((letter, index) => {
        if (letter === " ") {
          cursor += 11 * scale;
          return "";
        }
        const paths = GLYPHS[letter] || [];
        const tilt = index % 3 === 0 ? -2 : 1;
        const result = paths
          .map((path) => {
            const from = start + ((end - start) * stroke) / count;
            const to = start + ((end - start) * (stroke + 0.82)) / count;
            stroke += 1;
            return `<path class="ss-ink" d="${path}" pathLength="1"
          data-ink-start="${from}" data-ink-end="${to}" ${extra} />`;
          })
          .join("");
        const group = `<g transform="translate(${cursor} ${y + (index % 2) * 0.8})
        scale(${scale}) rotate(${tilt})">${result}</g>`;
        cursor +=
          (letter === "m" || letter === "w" ? 27 : letter === "i" || letter === "l" ? 13 : 23) *
          scale;
        return group;
      })
      .join("");
    return markup;
  };

  const traveller = (id, text, width, start, end, amount = false) => `
    <div class="ss-traveller ${amount ? "ss-traveller-amount" : "ss-traveller-title"}"
      data-traveller="${id}" style="width:${width}px">
      <svg class="ss-written-token" viewBox="0 0 ${width} 40" width="${width}" height="40">
        ${handwriting(text, 2, 6, amount ? 26 : 24, start, end)}
      </svg>
      <span class="ss-digital-token">${text}</span>
    </div>`;

  const createWorkspace = () => {
    const element = document.createElement("div");
    element.className = "ss-workspace";
    element.innerHTML = `
      <div class="ss-desk-light"></div>
      <div class="ss-desk-edge"></div>
      <div class="ss-receipt ss-receipt-dinner" data-receipt="dinner">
        <svg viewBox="0 0 175 242" width="175" height="242">
          <path class="ss-receipt-paper" d="M1 1H174V230l-9 10-9-10-9 10-9-10-9 10-9-10-9 10-9-10-9 10-9-10-9 10-9-10-9 10-9-10-9 10-9-10-9 10-9-10-8 10Z" />
          <g class="ss-receipt-print">
            <text x="87" y="32" text-anchor="middle">THE LONG DINNER</text>
            <path d="M18 47H157M18 167H157" stroke-dasharray="3 4" />
            <text x="20" y="74">A table for three</text>
            <text x="20" y="99">Good food</text><text x="20" y="124">Better company</text>
            <text x="20" y="150">Maya paid</text>
            <text class="ss-receipt-price" x="20" y="199">$120</text>
            <path d="M20 215h2m4 0h1m4 0h3m5 0h2m5 0h4m5 0h1m4 0h3m5 0h1m4 0h4m5 0h2m4 0h1m4 0h3m5 0h2m5 0h4" stroke-width="9" />
          </g>
        </svg>
      </div>
      <div class="ss-receipt ss-receipt-taxi" data-receipt="taxi">
        <svg viewBox="0 0 165 195" width="165" height="195">
          <path class="ss-receipt-paper" d="M1 1H164V185l-8 8-8-8-8 8-8-8-8 8-8-8-8 8-8-8-8 8-8-8-8 8-8-8-8 8-8-8-8 8-8-8-8 8-8-8-8 8Z" />
          <g class="ss-receipt-print">
            <text x="82" y="30" text-anchor="middle">THE WAY HOME</text>
            <path d="M18 45H147" stroke-dasharray="3 4" />
            <path d="M46 83h72l-9-21H63l-9 21m-8 0v19h72V83M61 104v6m43-6v6M61 92h5m33 0h5" />
            <text x="20" y="135">Leo paid</text>
            <text class="ss-receipt-price" x="20" y="168">$30</text>
          </g>
        </svg>
      </div>
      <div class="ss-calculator">
        <svg viewBox="0 0 155 222" width="155" height="222">
          <defs><linearGradient id="ss-calculator-body" x2="1" y2="1">
            <stop stop-color="#6b627b"/><stop offset="1" stop-color="#393343"/>
          </linearGradient></defs>
          <rect x="1" y="5" width="153" height="216" rx="17" fill="#302a3b" />
          <rect x="1" y="1" width="153" height="211" rx="17" fill="url(#ss-calculator-body)" />
          <rect x="15" y="21" width="125" height="47" rx="5" fill="#d8ddca" />
          <text x="127" y="53" text-anchor="end" fill="#49513c" class="ss-calculator-number">150 ÷ 3</text>
          ${Array.from({ length: 16 }, (_, index) => {
            const x = 17 + (index % 4) * 31;
            const y = 87 + Math.floor(index / 4) * 28;
            const labels = [
              "7",
              "8",
              "9",
              "+",
              "4",
              "5",
              "6",
              "−",
              "1",
              "2",
              "3",
              "÷",
              "C",
              "0",
              ".",
              "=",
            ];
            return `<rect x="${x}" y="${y + 2}" width="24" height="20" rx="4" fill="#26212d"/>
              <rect x="${x}" y="${y}" width="24" height="20" rx="4" fill="${index === 15 ? "#deedaa" : "#887c96"}"/>
              <text x="${x + 12}" y="${y + 14}" text-anchor="middle" fill="${index === 15 ? "#393343" : "#fffaf3"}">${labels[index]}</text>`;
          }).join("")}
        </svg>
      </div>
      <div class="ss-notebook">
        <svg class="ss-notebook-svg" viewBox="0 0 480 500" width="480" height="500">
          <defs>
            <linearGradient id="ss-paper-shade" x2="1" y2="0">
              <stop stop-color="#e6ded1"/><stop offset=".12" stop-color="#fffcf4"/>
              <stop offset=".9" stop-color="#fffdf7"/><stop offset="1" stop-color="#f0e9df"/>
            </linearGradient>
          </defs>
          <rect x="4" y="8" width="470" height="490" rx="8" fill="#806b91"/>
          <path d="M21 5H468L475 484H21Z" fill="#e2d9cc"/>
          <path d="M19 1H465L470 478H19Z" fill="url(#ss-paper-shade)"/>
          <path d="M53 1V478" stroke="#d5abac" stroke-width="1" opacity=".6"/>
          ${Array.from({ length: 12 }, (_, index) => `<path d="M28 ${100 + index * 29}H452" stroke="#ded9db" stroke-width=".7"/>`).join("")}
          ${Array.from(
            { length: 15 },
            (_, index) => `<ellipse cx="25" cy="${22 + index * 30}" rx="4" ry="5" fill="#c8bcae"/>
            <path d="M27 ${19 + index * 30}C-6 ${7 + index * 30} -5 ${37 + index * 30} 24 ${25 + index * 30}" fill="none" stroke="#7d7586" stroke-width="3"/>`,
          ).join("")}
          <g class="ss-paper-heading"><text x="77" y="47">ONE GOOD NIGHT.</text>
            <text x="77" y="73" class="ss-paper-subheading">Maya, Leo &amp; Nina · Friday, 8:42 pm</text></g>
          <rect data-source="dinner-title" x="76" y="119" width="128" height="40" fill="none"/>
          <rect data-source="dinner-amount" x="294" y="119" width="98" height="40" fill="none"/>
          <rect data-source="taxi-title" x="76" y="185" width="78" height="40" fill="none"/>
          <rect data-source="taxi-amount" x="315" y="185" width="74" height="40" fill="none"/>
          ${handwriting("maya paid", 79, 160, 16, 0.118, 0.15)}
          ${handwriting("leo paid", 79, 226, 16, 0.212, 0.235)}
          <g class="ss-manual-math">
            ${handwriting("120 + 30 = 150", 81, 270, 19, 0.242, 0.28)}
            <g data-erased>${handwriting("150 / 2 = 75", 106, 310, 19, 0.283, 0.308)}</g>
            <path class="ss-ink ss-correction" d="M91 326Q226 309 342 325M98 319Q205 335 333 316"
              pathLength="1" data-ink-start=".311" data-ink-end=".323"/>
            ${handwriting("150 / 3 = 50", 90, 344, 21, 0.326, 0.35)}
            ${handwriting("120 - 50 = 70", 67, 386, 16, 0.351, 0.365)}
            ${handwriting("30 - 50 = -20", 153, 425, 15, 0.366, 0.38)}
            <path class="ss-ink ss-correction" d="M338 362C391 356 390 306 345 300M353 294l-10 7 13 7"
              pathLength="1" data-ink-start=".381" data-ink-end=".388"/>
            <path class="ss-ink" d="M346 350C320 364 244 369 246 343C248 319 335 319 346 350Z"
              pathLength="1" data-ink-start=".389" data-ink-end=".397"/>
            ${handwriting("?", 389, 382, 47, 0.399, 0.412)}
          </g>
          <path class="ss-ink ss-slash" d="M72 448Q191 353 419 272" pathLength="1"
            data-ink-start=".429" data-ink-end=".445"/>
        </svg>
      </div>
      ${traveller("dinner-title", "Dinner", 128, 0.027, 0.077)}
      ${traveller("dinner-amount", "$120", 98, 0.081, 0.115, true)}
      ${traveller("taxi-title", "Taxi", 78, 0.16, 0.183)}
      ${traveller("taxi-amount", "$30", 74, 0.187, 0.209, true)}
      <div class="ss-hand">
        <svg viewBox="0 0 245 258" width="245" height="258" overflow="visible">
          <defs>
            <linearGradient id="ss-hand-skin" x1=".12" y1=".05" x2=".9" y2=".85">
              <stop stop-color="#f8c9a8"/><stop offset=".4" stop-color="#efb28e"/>
              <stop offset=".76" stop-color="#e8a582"/><stop offset="1" stop-color="#f2bd9c"/>
            </linearGradient>
            <linearGradient id="ss-finger-skin" x1=".2" y1="0" x2=".6" y2="1">
              <stop stop-color="#fbd2b5"/><stop offset=".5" stop-color="#efb18c"/>
              <stop offset="1" stop-color="#d78f6d"/>
            </linearGradient>
            <linearGradient id="ss-grip-shadow" x1="0" y1="0" x2=".8" y2="1">
              <stop stop-color="#d78d69"/><stop offset=".6" stop-color="#cc815f"/>
              <stop offset="1" stop-color="#e3a17d"/>
            </linearGradient>
            <linearGradient id="ss-thumb-skin" x1=".05" y1=".15" x2=".8" y2="1">
              <stop stop-color="#ffd8ba"/><stop offset=".35" stop-color="#f2ba96"/>
              <stop offset=".75" stop-color="#e8a783"/><stop offset="1" stop-color="#f2bd9b"/>
            </linearGradient>
            <radialGradient id="ss-hand-highlight" cx=".4" cy=".4" r=".65">
              <stop stop-color="#ffe1c5" stop-opacity=".58"/>
              <stop offset="1" stop-color="#ffe1c5" stop-opacity="0"/>
            </radialGradient>
            <linearGradient id="ss-pen-body" x1="0" y1="0" x2=".35" y2="1">
              <stop stop-color="#a18bd3"/><stop offset=".32" stop-color="#8063bd"/>
              <stop offset=".7" stop-color="#6546a1"/><stop offset="1" stop-color="#49327c"/>
            </linearGradient>
            <linearGradient id="ss-shirt-cuff" x1=".1" y1="0" x2=".9" y2="1">
              <stop stop-color="#f1eaf7"/><stop offset=".55" stop-color="#e4d9ee"/>
              <stop offset="1" stop-color="#cfc1de"/>
            </linearGradient>
            <clipPath id="ss-hand-contour">
              <path d="M584 453C605 443 625 439 644 427L692 396
                C705 386 719 386 732 395C756 412 775 429 799 445
                C822 461 845 476 867 487C894 499 909 512 916 536
                C925 569 930 613 939 656L951 708C958 738 970 760 987 781
                L1058 842L925 952C905 922 889 899 870 875
                C850 850 832 829 815 815C796 801 782 798 764 787
                C739 773 720 757 699 738C678 719 658 698 640 675
                C621 653 607 638 597 620C584 601 580 589 584 574
                C589 560 587 542 581 521C575 507 573 491 582 486
                C591 478 602 486 609 500L628 546C637 573 650 592 668 603
                C690 617 712 625 732 620C746 616 753 603 750 588
                L744 553C741 540 733 529 720 518L691 495
                C675 484 658 477 643 475C626 489 608 494 591 483
                C580 478 577 466 584 453Z"/>
            </clipPath>
          </defs>
          <!-- Reference-space artwork: translating the reference nib to zero preserves tracking. -->
          <g transform="scale(.34)">
            <g transform="translate(-537 -469)" stroke-linecap="round" stroke-linejoin="round">
              <!-- Recessed fingers behind the pencil, visible inside the relaxed grip. -->
              <path d="M626 473C650 463 678 473 699 488L741 523
                C760 541 765 563 756 584C745 611 724 623 704 616
                C679 609 661 588 651 564L629 515C620 497 614 481 626 473Z"
                fill="url(#ss-grip-shadow)"/>
              <path d="M684 516C700 510 719 522 728 541C738 561 740 583 729 600
                C722 611 711 616 703 611C693 604 695 591 690 578
                L676 544C671 530 674 520 684 516Z" fill="#e2a17d"/>
              <path d="M653 506C667 501 683 513 693 531C704 550 710 570 704 584
                C700 595 688 599 679 591C669 582 668 569 662 557
                L647 530C641 519 644 510 653 506Z" fill="#eab08c"/>
              <path d="M675 560C687 565 697 580 697 591M711 555C722 567 725 582 720 593"
                fill="none" stroke="#b66e51" stroke-width="1.6" opacity=".35"/>

              <!-- Continuous silhouette: index arch, back of hand, narrow wrist, thumb. -->
              <path d="M584 453C605 443 625 439 644 427L692 396
                C705 386 719 386 732 395C756 412 775 429 799 445
                C822 461 845 476 867 487C894 499 909 512 916 536
                C925 569 930 613 939 656L951 708C958 738 970 760 987 781
                L1058 842L925 952C905 922 889 899 870 875
                C850 850 832 829 815 815C796 801 782 798 764 787
                C739 773 720 757 699 738C678 719 658 698 640 675
                C621 653 607 638 597 620C584 601 580 589 584 574
                C589 560 587 542 581 521C575 507 573 491 582 486
                C591 478 602 486 609 500L628 546C637 573 650 592 668 603
                C690 617 712 625 732 620C746 616 753 603 750 588
                L744 553C741 540 733 529 720 518L691 495
                C675 484 658 477 643 475C626 489 608 494 591 483
                C580 478 577 466 584 453Z"
                fill="url(#ss-hand-skin)" stroke="#d99270" stroke-width="1.8"/>

              <!-- Broad, softly layered planes rather than separate outlined finger capsules. -->
              <g clip-path="url(#ss-hand-contour)" stroke="none">
                <path d="M709 391C741 417 760 439 791 463C824 488 856 507 872 540
                  C886 572 884 622 902 668C914 707 932 743 954 774
                  L1004 834L964 872C933 825 905 791 873 756
                  C838 719 812 681 795 648C778 614 770 579 752 548
                  C731 513 701 492 691 463C682 437 690 407 709 391Z"
                  fill="#c67e5c" opacity=".13"/>
                <path d="M713 402C742 418 758 438 783 458L843 501
                  C870 520 869 554 875 587L892 651C901 679 912 708 923 731
                  C892 699 870 669 854 636C838 604 832 575 812 549
                  C792 522 770 511 751 490C731 468 707 442 700 420Z"
                  fill="#ffe0c3" opacity=".27"/>
                <path d="M749 467C779 492 790 517 798 545C808 577 834 596 853 622
                  C844 587 848 559 827 533C811 513 781 490 749 467Z"
                  fill="#ffdec0" opacity=".22"/>
                <path d="M615 543C628 575 644 600 670 618C695 635 727 641 752 631
                  C758 645 755 661 740 665C719 667 689 652 667 637
                  C643 620 621 595 606 573Z" fill="#ffe1c6" opacity=".23"/>
                <path d="M614 589C630 615 660 642 686 662C712 683 742 703 761 729
                  C773 746 777 765 804 793C774 782 745 765 721 744
                  C693 720 668 692 647 667C625 641 609 622 603 607Z"
                  fill="#d98c68" opacity=".13"/>
                <path d="M671 645C724 663 759 695 795 731C825 762 848 798 875 823
                  C892 840 900 858 919 880L952 908L926 952
                  C887 892 859 848 816 815C787 793 766 786 742 766
                  C709 740 682 708 661 680Z" fill="url(#ss-hand-highlight)"/>
              </g>

              <!-- Index bends over the barrel; its fingertip points left, as in the reference. -->
              <path d="M585 455C606 447 625 443 646 429L692 397
                C704 389 716 390 726 398C750 416 770 439 785 463
                C801 488 808 510 801 523C795 534 781 532 768 524
                L727 493C710 480 700 465 697 449
                C687 470 670 479 653 479C633 487 607 493 591 482
                C580 477 577 465 585 455Z"
                fill="url(#ss-finger-skin)"/>
              <path d="M695 432C688 453 690 470 703 485L735 512
                C746 521 754 525 764 527C742 506 726 487 713 468
                C706 457 702 442 700 428Z" fill="#c98461" opacity=".23"/>
              <path d="M591 457C620 449 642 438 666 421L694 403
                C702 398 710 399 716 404C705 406 691 414 681 421
                L644 446C625 458 607 465 588 467Z" fill="#ffe2c7" opacity=".4"/>
              <path d="M585 456C596 454 604 451 613 446C617 450 617 454 612 458
                C604 464 595 467 584 468C581 464 582 460 585 456Z"
                fill="#f8d9c0" stroke="#e4b08c" stroke-width="1"/>
              <path d="M695 431C691 448 694 463 703 474M645 455C645 468 650 475 660 478
                M748 508C752 519 758 525 767 529" fill="none" stroke="#b97554"
                stroke-width="1.6" opacity=".38"/>

              <!-- The pencil crosses the open grip at the reference's shallow angle. -->
              <path d="M545 474L567 477L906 627Q922 632 923 643
                Q920 657 907 656L557 494Z" fill="#875341" opacity=".15"
                transform="translate(1 5)"/>
              <path d="M537 469L561 471L570 481L559 490Z" fill="#d6bc92"/>
              <path d="M537 469L546 471L543 476Z" fill="#433544"/>
              <path d="M561 471Q568 468 576 472L902 623
                Q917 629 919 641Q919 653 907 654L559 493Q559 481 561 471Z"
                fill="url(#ss-pen-body)" stroke="#5a3e91" stroke-width="1.4"/>
              <path d="M572 474L897 625L909 639L567 484Z" fill="#a98ed8" opacity=".42"/>
              <path d="M565 488L907 648L905 654L559 493Z" fill="#493078" opacity=".4"/>
              <path d="M654 512L889 621" fill="none" stroke="#d4c2f1"
                stroke-width="3.5" opacity=".75"/>
              <path d="M760 556L877 610Q882 613 881 617L875 617L758 562
                Q754 558 760 556Z" fill="#c4afe5" opacity=".9"/>
              <path d="M898 623C885 623 878 634 883 644M905 627C893 628 888 638 892 647"
                fill="none" stroke="#b7a0db" stroke-width="1.7" opacity=".7"/>
              <path d="M915 632C906 628 898 634 899 643C899 650 907 655 914 651
                C921 647 921 637 915 632Z" fill="#4c3284" stroke="#a58bd0" stroke-width="1.2"/>

              <!-- Thumb overlays the near side of the pencil; one natural nail, not five exposed tips. -->
              <path d="M582 486C592 479 604 489 610 504C616 520 620 538 626 553
                C633 574 647 591 665 605C689 624 711 634 731 635
                C735 646 725 652 712 651C687 648 662 632 641 614
                C620 595 598 579 589 556L579 521C575 506 574 491 582 486Z"
                fill="url(#ss-thumb-skin)"/>
              <path d="M582 490C589 484 598 491 602 502L609 521
                C610 525 607 529 601 531L587 542
                C583 530 579 514 578 504C577 497 579 492 582 490Z"
                fill="#fae0ca" stroke="#e1ab89" stroke-width="1.3"/>
              <path d="M582 494C587 490 592 494 595 499L600 511"
                fill="none" stroke="#fff0de" stroke-width="2.2" opacity=".65"/>
              <path d="M597 563C605 556 612 555 619 559M594 573C603 568 611 568 617 572
                M634 601C637 593 642 588 648 586" fill="none" stroke="#cf8d69"
                stroke-width="1.4" opacity=".35"/>
              <path d="M600 579C612 598 636 619 660 635C686 653 713 669 742 684"
                fill="none" stroke="#ffe1c3" stroke-width="7" opacity=".11"/>

              <!-- Long, tapered wrist flows into the diagonal lavender cuff. -->
              <path d="M1049 829C1059 824 1068 826 1075 835L1259 1048V1240
                L1068 1240L908 983C901 972 902 960 913 951Z"
                fill="url(#ss-shirt-cuff)" stroke="#cbbbdc" stroke-width="1.8"/>
              <path d="M1062 853L938 956C930 963 927 971 934 981L1073 1150
                L1225 1020Z" fill="#efe7f7" opacity=".55"/>
              <path d="M1062 853L938 956C930 963 927 971 934 981L1073 1150"
                fill="none" stroke="#d2c2e1" stroke-width="1.8"/>
              <path d="M1068 863L1128 945M968 969L1068 1090"
                fill="none" stroke="#fff9ff" stroke-width="3" opacity=".35"/>
              <path d="M1073 1150L1225 1020L1259 1048V1240H1144Z"
                fill="#c7b8d8" opacity=".2"/>
            </g>
          </g>
        </svg>
      </div>`;
    return element;
  };

  story.createWorkspace = createWorkspace;
})();
