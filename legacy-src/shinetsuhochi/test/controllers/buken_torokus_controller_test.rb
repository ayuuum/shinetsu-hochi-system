require 'test_helper'

class BukenTorokusControllerTest < ActionController::TestCase
  setup do
    @buken_toroku = buken_torokus(:one)
  end

  test "should get index" do
    get :index
    assert_response :success
    assert_not_nil assigns(:buken_torokus)
  end

  test "should get new" do
    get :new
    assert_response :success
  end

  test "should create buken_toroku" do
    assert_difference('BukenToroku.count') do
      post :create, buken_toroku: { age: @buken_toroku.age, name: @buken_toroku.name }
    end

    assert_redirected_to buken_toroku_path(assigns(:buken_toroku))
  end

  test "should show buken_toroku" do
    get :show, id: @buken_toroku
    assert_response :success
  end

  test "should get edit" do
    get :edit, id: @buken_toroku
    assert_response :success
  end

  test "should update buken_toroku" do
    patch :update, id: @buken_toroku, buken_toroku: { age: @buken_toroku.age, name: @buken_toroku.name }
    assert_redirected_to buken_toroku_path(assigns(:buken_toroku))
  end

  test "should destroy buken_toroku" do
    assert_difference('BukenToroku.count', -1) do
      delete :destroy, id: @buken_toroku
    end

    assert_redirected_to buken_torokus_path
  end
end
