<?php
/* @var $this UserController */

?>
<div class="container">
    <form>
        <h4>Add User</h4>
        <div class="form-group">
            <label for="label-name">Name</label>
            <input name="email" class="form-control" placeholder="ABC XYZ">
        </div>

        <div class="form-group">
            <label for="label-email">Email address</label>
            <input type="email" name="email" class="form-control" placeholder="name@example.com">
        </div>

        <div class="form-group">
            <label for="label-address">Address</label>
            <textarea class="form-control" rows="3"></textarea>
        </div>

        <div class="form-group">
            <label for="label-file">Upload File</label>
            <input type="file" class="form-control-file" id="file" name="file">
        </div>

        <button type="submit" class="btn btn-primary">Submit</button>
    </form>
</div>