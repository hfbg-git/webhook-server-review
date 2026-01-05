export declare function getMonthlySheetName(): string;
export declare function findSpreadsheetByName(parentId: string, sheetName: string): Promise<string | null>;
export declare function createSpreadsheet(parentId: string, sheetName: string): Promise<string>;
export declare function getOrCreateMonthlySpreadsheet(): Promise<{
    spreadsheetId: string;
    sheetName: string;
}>;
//# sourceMappingURL=driveService.d.ts.map