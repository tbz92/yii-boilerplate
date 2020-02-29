<?php

class m200227_201654_createUserTable extends CDbMigration
{
    public function safeUp()
    {
        $this->createTable('users', [
            'id' => 'int(11) not null primary key auto_increment',
            'first_name' => 'varchar(50) not null',
            'last_name' => 'varchar(50) not null',
            'email' => 'varchar(50) not null unique',
            'marks' => 'text default null',
            'status' => 'tinyint(1) default 1',
            'created_by' => 'varchar(100) not null',
            'created_at' => 'timestamp not null default current_timestamp',
            'updated_by' => 'varchar(100) not null',
            'updated_at' => 'timestamp not null default "0000-00-00 00:00:00"',
        ]);
    }

    public function safeDown()
    {
        $this->dropTable('users');
    }
}