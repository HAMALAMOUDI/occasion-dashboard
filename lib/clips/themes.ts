import type { OccasionType } from "../occasions";

// Two animated invitation styles, inspired by (not copied from) two art films:
//   collage — cut-paper leaves, petals and motifs drift in and settle into a
//             wreath around the invitation, on a soft paper ground.
//   threads — fans of fine glowing strands sweep and swirl like a dancer's
//             skirt, with a ribbon and falling petals, on a deep ground.
export type ClipStyle = "collage" | "threads";
export const CLIP_STYLES: ClipStyle[] = ["collage", "threads"];

export type Motif =
  | "leaf"
  | "maple"
  | "petal"
  | "blossom"
  | "heart"
  | "star"
  | "crescent"
  | "lantern"
  | "paisley"
  | "confetti"
  | "balloon"
  | "cloud"
  | "shard"
  | "cap";

export interface CollageTheme {
  ground: [string, string]; // background gradient, top → bottom
  ink: string; // main text
  muted: string; // secondary text
  accent: string; // ornaments, call to action
  pieces: string[]; // paper colours
  motifs: Motif[]; // weighted by repetition
  calm?: boolean; // solemn: slow drift, no celebratory burst
}

export interface ThreadsTheme {
  ground: [string, string]; // radial: centre → edge
  ink: string;
  muted: string;
  accent: string;
  strands: [string, string][]; // per bundle: colour from → to
  ribbon: string;
  sparkle: string | null; // falling petals; null = none
  calm?: boolean;
}

export interface ClipTheme {
  collage: CollageTheme;
  threads: ThreadsTheme;
}

export const CLIP_THEMES: Record<OccasionType, ClipTheme> = {
  wedding: {
    collage: {
      ground: ["#f6f2ea", "#ece4d6"],
      ink: "#2b2418",
      muted: "#6b5a3c",
      accent: "#9a7a3c",
      pieces: ["#f4efe6", "#ead9c8", "#e7c3bd", "#c9a35f", "#a9b48f", "#ffffff"],
      motifs: ["blossom", "blossom", "petal", "petal", "leaf", "leaf"],
    },
    threads: {
      ground: ["#123a31", "#06140f"],
      ink: "#f6ecd6",
      muted: "#bccbbf",
      accent: "#e3c27a",
      strands: [["#f6ecd6", "#e3c27a"], ["#e3c27a", "#b08a4a"], ["#ffffff", "#e9d9b0"]],
      ribbon: "#e3c27a",
      sparkle: "#f3dca8",
    },
  },
  henna: {
    collage: {
      ground: ["#f7ebdf", "#efd9c6"],
      ink: "#4a1f14",
      muted: "#8a4a35",
      accent: "#9a3b22",
      pieces: ["#9a3b22", "#c0612c", "#e1a04a", "#6e2a1c", "#7c8a3c", "#f3d29a"],
      motifs: ["paisley", "paisley", "leaf", "petal", "blossom"],
    },
    threads: {
      ground: ["#4a1414", "#1c0606"],
      ink: "#fbe9d8",
      muted: "#ddb3a0",
      accent: "#f2b24a",
      strands: [["#f2b24a", "#e06a2c"], ["#c0392b", "#7a1a1a"], ["#fbe0a8", "#f2b24a"]],
      ribbon: "#7c9a3c",
      sparkle: "#f6c86a",
    },
  },
  engagement: {
    collage: {
      ground: ["#f7eeec", "#eedfdc"],
      ink: "#3a2128",
      muted: "#7a5560",
      accent: "#a8506a",
      pieces: ["#e9b8c0", "#f4d6d6", "#c97a8a", "#ffffff", "#b6c4a6", "#e3c58f"],
      motifs: ["heart", "petal", "petal", "blossom", "leaf"],
    },
    threads: {
      ground: ["#3a1838", "#140812"],
      ink: "#fbe9f1",
      muted: "#d8b5c8",
      accent: "#f0b9cc",
      strands: [["#f0b9cc", "#c06a8e"], ["#e7c58f", "#b0884a"], ["#ffffff", "#f0b9cc"]],
      ribbon: "#e7c58f",
      sparkle: "#ffd6e2",
    },
  },
  graduation: {
    collage: {
      ground: ["#eef1f5", "#dfe5ee"],
      ink: "#14233f",
      muted: "#4a5a78",
      accent: "#c9962a",
      pieces: ["#1f3a6b", "#2d55a0", "#e3b23c", "#ffffff", "#c0392b", "#7fa6d8"],
      motifs: ["confetti", "confetti", "star", "star", "cap"],
    },
    threads: {
      ground: ["#1a2f63", "#070d22"],
      ink: "#f4f1ea",
      muted: "#b9c4e0",
      accent: "#f2c24a",
      strands: [["#f2c24a", "#e39a1f"], ["#4a7ad8", "#1f3f8f"], ["#fbe7a8", "#f2c24a"]],
      ribbon: "#d83a2b",
      sparkle: "#f6d36a",
    },
  },
  eid: {
    collage: {
      ground: ["#f2f0e6", "#e4e2d2"],
      ink: "#12342c",
      muted: "#4d6a5f",
      accent: "#b08a3c",
      pieces: ["#1d5c4d", "#2f7a64", "#d6b46a", "#f6efd9", "#e3c27a", "#9cc4b0"],
      motifs: ["crescent", "star", "star", "lantern", "blossom"],
    },
    threads: {
      ground: ["#124038", "#05140f"],
      ink: "#f4efe0",
      muted: "#b5cfc4",
      accent: "#e6c06c",
      strands: [["#e6c06c", "#b88a3a"], ["#4fb08e", "#1d6b55"], ["#fff3d6", "#e6c06c"]],
      ribbon: "#e6c06c",
      sparkle: "#f6dc94",
    },
  },
  ramadan: {
    collage: {
      ground: ["#eeebf3", "#dcd6e6"],
      ink: "#1c1a3a",
      muted: "#57527a",
      accent: "#b88a2c",
      pieces: ["#26305a", "#3d4a8a", "#e3b23c", "#f6e7c1", "#7a4a24", "#c9a96a"],
      motifs: ["lantern", "lantern", "crescent", "star", "star"],
    },
    threads: {
      ground: ["#22285a", "#07081c"],
      ink: "#f6efe0",
      muted: "#bcbad8",
      accent: "#f0c35a",
      strands: [["#f0c35a", "#c98a2a"], ["#6a6fd8", "#2d3290"], ["#fff1c8", "#f0c35a"]],
      ribbon: "#c9572a",
      sparkle: "#f8d980",
    },
  },
  newborn: {
    collage: {
      ground: ["#eef5f8", "#dde9f0"],
      ink: "#22354a",
      muted: "#4f657d",
      accent: "#2f6f9e",
      pieces: ["#bcd9ee", "#f6cfd5", "#ffffff", "#ffe39a", "#9fd3c4", "#d7c8f0"],
      motifs: ["cloud", "cloud", "star", "star", "heart", "balloon"],
    },
    threads: {
      ground: ["#22345c", "#0a1226"],
      ink: "#f2f7ff",
      muted: "#bccce6",
      accent: "#ffd27a",
      strands: [["#9ccaf0", "#4f8fd0"], ["#f6b9c6", "#d0708a"], ["#ffffff", "#bfe0ff"]],
      ribbon: "#ffd27a",
      sparkle: "#ffe9a8",
    },
  },
  birthday: {
    collage: {
      ground: ["#fbf4e6", "#f2e4cc"],
      ink: "#2a1a08",
      muted: "#6b5232",
      accent: "#d0452a",
      pieces: ["#ffcf3f", "#ff6b6b", "#4ecdc4", "#5b7cfa", "#ff9f43", "#ffffff"],
      motifs: ["balloon", "balloon", "confetti", "confetti", "star"],
    },
    threads: {
      ground: ["#2b1d5c", "#0c0820"],
      ink: "#fff6e0",
      muted: "#cfc6f0",
      accent: "#ffcf3f",
      strands: [["#ffcf3f", "#ff7a3a"], ["#4ecdc4", "#2b7fd8"], ["#ff8ad0", "#c04aa8"]],
      ribbon: "#ff5f6d",
      sparkle: "#ffe27a",
    },
  },
  corporate: {
    collage: {
      ground: ["#eef0f2", "#dde1e6"],
      ink: "#141a24",
      muted: "#4e5868",
      accent: "#a8862f",
      pieces: ["#1f2a3c", "#3b4a5c", "#c8a24a", "#ffffff", "#8a98aa", "#2d5a8a"],
      motifs: ["shard", "shard", "shard", "confetti"],
    },
    threads: {
      ground: ["#1d222b", "#07090c"],
      ink: "#f2f2f0",
      muted: "#b0b4bc",
      accent: "#d6b45c",
      strands: [["#d6b45c", "#9a7a2c"], ["#c8ccd4", "#6a707c"], ["#ffffff", "#d6b45c"]],
      ribbon: "#3a6ea8",
      sparkle: "#e8d08a",
    },
  },
  condolence: {
    collage: {
      ground: ["#ecebe7", "#dddcd6"],
      ink: "#2a2c2e",
      muted: "#5e6266",
      accent: "#6b7066",
      pieces: ["#ffffff", "#f4f2ec", "#cfd2c8", "#9aa392", "#e6e4dc"],
      motifs: ["blossom", "blossom", "leaf", "petal"],
      calm: true,
    },
    threads: {
      ground: ["#2a2d30", "#0e0f10"],
      ink: "#eeeeea",
      muted: "#a9adb0",
      accent: "#c9ccc6",
      strands: [["#e6e6e2", "#9aa0a4"], ["#c9ccc6", "#6e7478"]],
      ribbon: "#8a9088",
      sparkle: null,
      calm: true,
    },
  },
  other: {
    collage: {
      ground: ["#efeeeb", "#e2e0da"],
      ink: "#2a2014",
      muted: "#6b5640",
      accent: "#c0571c",
      pieces: ["#e8742a", "#f2a23a", "#d8452a", "#f6c45a", "#b5311c", "#8a9a4a"],
      motifs: ["maple", "maple", "leaf", "leaf", "blossom"],
    },
    threads: {
      ground: ["#1f2f5c", "#08101f"],
      ink: "#fbf3df",
      muted: "#c3cbe0",
      accent: "#f4c43a",
      strands: [["#f4c43a", "#e8952a"], ["#3f6fd0", "#1d3a8a"], ["#fbe39a", "#f4c43a"]],
      ribbon: "#d8352a",
      sparkle: "#f6cf4a",
    },
  },
};
