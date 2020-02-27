<?php

class m200227_201654_createUserTable extends CDbMigration
{
    public function safeUp()
    {
        $this->createTable('users', [
            'id' => 'int(11) not null primary key auto_increment',
            'name' => 'varchar(50) not null',
            'email' => 'varchar(50) not null',
            'address' => 'text default null',
        ]);
    }

    public function safeDown()
    {
        $this->dropTable('users');
    }
}