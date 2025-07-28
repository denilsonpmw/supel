exports.up = function(knex) {
  return knex.schema.createTable('relatorios_personalizados', function(table) {
    table.increments('id').primary();
    table.integer('usuario_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.string('nome', 100).notNullable();
    table.text('descricao');
    table.string('categoria', 50);
    table.jsonb('campos').notNullable();
    table.jsonb('ordem_colunas');
    table.jsonb('filtros');
    table.string('cor', 20);
    table.timestamp('criado_em').defaultTo(knex.fn.now());
    table.timestamp('atualizado_em').defaultTo(knex.fn.now());
    table.index('usuario_id', 'idx_relatorios_personalizados_usuario_id');
  });
};

exports.down = function(knex) {
  return knex.schema.dropTableIfExists('relatorios_personalizados');
};
