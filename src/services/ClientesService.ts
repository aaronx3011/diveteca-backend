
import poolPromise from '../config/database';

export class ClientesService {
    static async getClientesList() {
        const pool = await poolPromise;
        const query = `
            SELECT co_cli as [Codigo_Cliente], cli_des as [Nombre_Cliente], tip_cli as [Tipo_Cliente]
            FROM [aaron_view_Clientes]
        `;
        const result = await pool.request().query(query);
        return result.recordset;
    }

}