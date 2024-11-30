export function getGridDensity(zoom: number): number {
    switch (zoom) {
      case 0:
        return 30;
      case 1:
        return 15;
      case 2:
        return 10;
      case 3:
        return 7.5;
      case 4:
        return 5;
      case 5:
        return 3;
      case 6:
        return 2;
      case 7:
        return 1.5;
      case 8:
        return 0.75;
      case 9:
        return 0.5;
      case 10:
        return 0.25;
      case 11:
        return 0.125;
      case 12:
        return 0.075;
      case 13:
        return 0.05;
      case 14:
        return 0.025;
      default:
        return 30;
    }
  }
  
  