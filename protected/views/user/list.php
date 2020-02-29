<?php
/* @var $this UserController */
?>
<div class="container">
    <table class="table">
        <thead>
        <tr>
            <th scope="col">#</th>
            <th scope="col">First Name</th>
            <th scope="col">Last Name</th>
            <th scope="col">Email</th>
            <th scope="col">Marks</th>
            <th scope="col">Status</th>
            <th scope="col">Action</th>
        </tr>
        </thead>
        <tbody>
        <?php
        /** @var User[] $users */
        foreach ($users as $user) { ?>
            <tr>
                <td scope="row"><?php echo $user->id ?></td>
                <td><?php echo $user->first_name ?></td>
                <td><?php echo $user->last_name ?></td>
                <td><?php echo $user->email ?></td>
                <td><?php echo $user->marks ?></td>
                <td><?php echo $user->status ? 'Active' : 'False' ?></td>
                <td>
                    <a href=<?php echo Yii::app()->createUrl("user/update/id/$user->id") ?>>Edit</a> |
                    <a href=<?php echo Yii::app()->createUrl("user/delete/id/$user->id") ?>>Delete</a>
                </td>
            </tr>
            <?php
        }
        ?>
        </tbody>
    </table>
</div>