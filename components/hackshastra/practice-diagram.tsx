import styles from "./practice-diagram.module.css";

type PracticeMode = "build" | "learn" | "lead";

function Asterisk({
  x,
  y,
  size = 22,
}: {
  x: number;
  y: number;
  size?: number;
}) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <path
        d={`M0 ${-size}V${size}M${-size * 0.866} ${-size * 0.5}L${size * 0.866} ${size * 0.5}M${-size * 0.866} ${size * 0.5}L${size * 0.866} ${-size * 0.5}`}
      />
    </g>
  );
}

function BuildDiagram() {
  return (
    <>
      <path className={styles.guide} d="M32 326H486M32 321V331M486 321V331" />
      <path
        className={styles.connector}
        d="M178 113H206Q223 113 223 132V171H256M178 236H206Q223 236 223 218V171M245 161L256 171L245 181"
      />
      <g transform="rotate(-5 102 113)">
        <rect
          className={styles.outline}
          x="28"
          y="62"
          width="150"
          height="102"
        />
        <text className={styles.micro} x="43" y="85">
          THE SPARK
        </text>
        <text className={styles.label} x="43" y="141">
          An idea.
        </text>
        <g className={styles.paperStroke}>
          <Asterisk x={145} y={113} size={15} />
        </g>
      </g>
      <g transform="rotate(4 103 235)">
        <rect
          className={styles.outline}
          x="28"
          y="191"
          width="150"
          height="90"
        />
        <text className={styles.micro} x="43" y="215">
          THE COLLECTIVE
        </text>
        <text className={styles.label} x="43" y="258">
          Your people.
        </text>
      </g>
      <g transform="rotate(6 374 179)">
        <rect
          className={styles.backing}
          x="248"
          y="55"
          width="224"
          height="262"
        />
        <rect
          className={styles.redFill}
          x="259"
          y="44"
          width="224"
          height="262"
        />
        <path className={styles.inkRule} d="M277 85H465" />
        <circle className={styles.inkFill} cx="283" cy="65" r="3" />
        <circle className={styles.inkFill} cx="295" cy="65" r="3" />
        <circle className={styles.inkFill} cx="307" cy="65" r="3" />
        <text className={styles.inkMicro} x="463" y="69" textAnchor="end">
          MADE TOGETHER
        </text>
        <text className={styles.inkLabel} x="279" y="124">
          THE FIRST
        </text>
        <text className={styles.demo} x="273" y="188">
          DEMO.
        </text>
        <path className={styles.inkRule} d="M278 204H462" />
        <text className={styles.inkHand} x="279" y="242">
          From “what if”
        </text>
        <text className={styles.inkHand} x="279" y="268">
          to “we made it.”
        </text>
        <g className={styles.inkStroke}>
          <Asterisk x={443} y={262} size={16} />
        </g>
      </g>
      <text className={styles.footer} x="32" y="348">
        IDEA + PEOPLE → SOMETHING REAL
      </text>
    </>
  );
}

function LearnDiagram() {
  return (
    <>
      <ellipse
        className={styles.guide}
        cx="259"
        cy="185"
        rx="202"
        ry="132"
        transform="rotate(9 259 185)"
      />
      <path
        className={styles.connector}
        d="M175 102C202 93 216 100 224 117M213 111L224 117L226 105M333 199C356 204 366 214 367 237M359 227L367 237L375 226"
      />
      <path
        className={styles.returnPath}
        d="M324 292C212 348 95 310 77 203C73 177 78 157 87 143"
      />
      <path className={styles.connector} d="M76 147L87 143L90 155" />
      <g transform="rotate(-8 120 103)">
        <rect
          className={styles.paperFill}
          x="40"
          y="60"
          width="162"
          height="86"
        />
        <text className={styles.inkMicro} x="56" y="85">
          A STARTING POINT
        </text>
        <text className={styles.inkLabel} x="56" y="124">
          Your idea.
        </text>
      </g>
      <circle className={styles.redFill} cx="259" cy="174" r="87" />
      <circle className={styles.inkRule} cx="259" cy="174" r="76" />
      <text className={styles.inkMicro} x="259" y="127" textAnchor="middle">
        A FRESH PERSPECTIVE
      </text>
      <g className={styles.inkStroke}>
        <Asterisk x={259} y={171} size={29} />
      </g>
      <text className={styles.inkLabel} x="259" y="229" textAnchor="middle">
        Feedback.
      </text>
      <g transform="rotate(6 393 279)">
        <rect
          className={styles.outline}
          x="312"
          y="237"
          width="164"
          height="88"
        />
        <text className={styles.micro} x="329" y="261">
          A STEP FORWARD
        </text>
        <text className={styles.label} x="329" y="303">
          Next version.
        </text>
      </g>
      <text
        className={styles.hand}
        x="103"
        y="302"
        transform="rotate(-8 103 302)"
      >
        A little better,
      </text>
      <text
        className={styles.hand}
        x="109"
        y="328"
        transform="rotate(-8 109 328)"
      >
        every time.
      </text>
      <circle className={styles.paperFill} cx="440" cy="156" r="4" />
      <path className={styles.guide} d="M429 156H451M440 145V167" />
    </>
  );
}

function LeadDiagram() {
  return (
    <>
      <circle className={styles.guide} cx="251" cy="177" r="134" />
      <circle className={styles.returnPath} cx="251" cy="177" r="111" />
      <path
        className={styles.connector}
        d="M140 100C167 104 172 124 180 134M333 150C358 150 373 126 389 116M286 249C290 272 304 287 329 287"
      />
      <circle className={styles.redFill} cx="251" cy="177" r="82" />
      <text className={styles.inkMicro} x="251" y="134" textAnchor="middle">
        A SHARED START
      </text>
      <text className={styles.networkTitle} x="251" y="178" textAnchor="middle">
        MORE
      </text>
      <text className={styles.networkTitle} x="251" y="215" textAnchor="middle">
        PLACES.
      </text>
      <g transform="rotate(-7 98 91)">
        <rect
          className={styles.paperFill}
          x="20"
          y="54"
          width="153"
          height="77"
        />
        <text className={styles.inkMicro} x="37" y="78">
          CAMPUS CHAPTER
        </text>
        <text className={styles.inkLabel} x="36" y="114">
          IPEC
        </text>
        <circle className={styles.redFill} cx="153" cy="110" r="4" />
      </g>
      <g transform="rotate(5 416 94)">
        <rect
          className={styles.paperFill}
          x="341"
          y="55"
          width="153"
          height="77"
        />
        <text className={styles.inkMicro} x="358" y="79">
          CAMPUS CHAPTER
        </text>
        <text className={styles.inkLabel} x="357" y="115">
          SRM–AP
        </text>
        <circle className={styles.redFill} cx="475" cy="112" r="4" />
      </g>
      <g transform="rotate(4 407 288)">
        <rect
          className={styles.invitation}
          x="324"
          y="247"
          width="175"
          height="84"
        />
        <text className={styles.micro} x="340" y="273">
          THE NEXT CHAPTER?
        </text>
        <text className={styles.label} x="340" y="309">
          Your campus.
        </text>
      </g>
      <path className={styles.connector} d="M318 278L329 287L316 293" />
      <text
        className={styles.hand}
        x="26"
        y="285"
        transform="rotate(-6 26 285)"
      >
        Bring it closer
      </text>
      <text
        className={styles.hand}
        x="28"
        y="312"
        transform="rotate(-6 28 312)"
      >
        to home.
      </text>
      <g className={styles.paperStroke}>
        <Asterisk x={77} y={209} size={16} />
      </g>
    </>
  );
}

export default function PracticeDiagram({ mode }: { mode: PracticeMode }) {
  return (
    <div className={styles.diagram} aria-hidden="true">
      <svg
        className={styles.canvas}
        viewBox="0 0 520 360"
        fill="none"
        focusable="false"
      >
        <path
          className={styles.registration}
          d="M8 19V8H19M501 8H512V19M8 341V352H19M501 352H512V341"
        />
        <g>
          {mode === "build" && <BuildDiagram />}
          {mode === "learn" && <LearnDiagram />}
          {mode === "lead" && <LeadDiagram />}
        </g>
      </svg>
    </div>
  );
}
