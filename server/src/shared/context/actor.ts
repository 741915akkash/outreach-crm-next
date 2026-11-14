export type Actor =
  | {
      type: 'USER';
      id: string;
    }
  | {
      type: 'AGENT';
      id: string;
    }
  | {
      type: 'INTEGRATION';
      id: string;
    }
  | {
      type: 'SYSTEM';
      id: string;
    };
