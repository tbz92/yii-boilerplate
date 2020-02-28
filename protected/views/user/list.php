<?php
/* @var $this UserController */
?>
<div class="container">
    <table class="table">
        <thead>
        <tr>
            <th scope="col">#</th>
            <th scope="col">Name</th>
            <th scope="col">Email</th>
            <th scope="col">Address</th>
            <th scope="col">Action</th>
        </tr>
        </thead>
        <tbody>
        <?php
        foreach ($users as $user) { ?>
            <tr>
                <td scope="row"><?php echo $user->id ?></td>
                <td><?php echo $user->name ?></td>
                <td><?php echo $user->email ?></td>
                <td><?php echo $user->address ?></td>
                <td>
                    <a class="btn btn-lg"
                       href=<?php echo Yii::app()->createUrl("user/update/id/$user->id") ?>>Edit
                    </a>
                    <a class="btn btn-lg"
                       href=<?php echo Yii::app()->createUrl("user/delete/id/$user->id") ?>>Delete
                    </a>
                </td>
            </tr>
            <?php
        }
        ?>
        </tbody>
    </table>
</div>