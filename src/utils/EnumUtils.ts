export class EnumUtils {
    static isInEnum(requestedEnum: any, enumValue: any): boolean {
        const keys = Object.keys(requestedEnum).filter((x) => requestedEnum[x] === enumValue);

        return keys.length > 0;
    }

    static toEnum<T>(requestedEnum: any, enumValue: any): T {
        if (!this.isInEnum(requestedEnum, enumValue)) {
            throw new Error(`Value '${enumValue}' is not a valid member of the provided enum.`);
        }
        return enumValue as T;
    }
}