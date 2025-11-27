import * as dotenv from 'dotenv';

export class EnvDto {
    public DB_HOST: string;
    public DB_PORT: string;
    public DB_USER: string;
    public DB_PASS: string;
    public DB_NAME: string;
    public JWT_SECRET: string;
    public DB_SSL: boolean;
    
    constructor() {
        dotenv.config();
        
        // Tüm değerler .env'den alınmalı, varsayılan değer yok
        // Railway bağlantıları kaldırıldı, artık tamamen env'den çalışıyor
        this.DB_HOST = process.env.DB_HOST;
        if (!this.DB_HOST) {
            throw new Error('DB_HOST environment variable is required');
        }
        
        this.DB_PORT = process.env.DB_PORT || '5432';
        this.DB_USER = process.env.DB_USERNAME;
        if (!this.DB_USER) {
            throw new Error('DB_USERNAME environment variable is required');
        }
        
        this.DB_PASS = process.env.DB_PASSWORD;
        if (!this.DB_PASS) {
            throw new Error('DB_PASSWORD environment variable is required');
        }
        
        this.DB_NAME = process.env.DB_DATABASE;
        if (!this.DB_NAME) {
            throw new Error('DB_DATABASE environment variable is required');
        }
        
        this.JWT_SECRET = process.env.JWT_SECRET;
        if (!this.JWT_SECRET) {
            throw new Error('JWT_SECRET environment variable is required');
        }
        
        this.DB_SSL = process.env.DB_SSL ? process.env.DB_SSL === 'true' : false;
    }
}
