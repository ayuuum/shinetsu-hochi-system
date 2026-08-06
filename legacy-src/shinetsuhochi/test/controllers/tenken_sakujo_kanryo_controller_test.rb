require 'test_helper'

class TenkenSakujoKanryoControllerTest < ActionController::TestCase
  test "should get index" do
    get :index
    assert_response :success
  end

end
